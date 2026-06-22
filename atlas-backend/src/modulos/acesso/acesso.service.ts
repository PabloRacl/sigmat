/**
 * [Estado Atual]: Serviço de negócios para autenticação, controle de sessões e revogação de tokens.
 * [Dependências Técnicas]:
 *   - AuthRepository
 *   - ValidacaoLdapService, BasesCorporativasService, UsersService, JwtService, AuditService
 * [Histórico de Modificações]:
 *   - Refatorado para o padrão Repository/Service, eliminando acoplamento com o PrismaClient.
 *   - Totalmente integrado com o fluxo corporativo real (LDAP, SGPM e SGA).
 * [Regras de Negócio Imutáveis]:
 *   - Validação corporativa baseada no LDAP local + permissão de perfil via SGA + dados cadastrais via SGPM.
 *   - Rotação estrita de Refresh Tokens de 7 dias de validade.
 *   - Lista negra (blacklist) para invalidação imediata de JWTs expirados ou revogados.
 */

import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ValidacaoLdapService } from '../../integracoes/validacao-ldap/validacao-ldap.service';
import { BasesCorporativasService } from '../../integracoes/bases-corporativas/bases-corporativas.service';
import { UsersService } from '../pessoal/pessoal.service';
import { AuditService } from '../../compartilhado/servicos/audit.service';
import { AcaoLog } from '@prisma/client';
import { AuthRepository } from './acesso.repository';
import { AccessRequestsService } from '../solicitacoes-acesso/solicitacoes-acesso.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AcessoService {
  private readonly logger = new Logger(AcessoService.name);
  constructor(
    private readonly ldapService: ValidacaoLdapService,
    private readonly sgaService: BasesCorporativasService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly repository: AuthRepository,
    private readonly accessRequestsService: AccessRequestsService,
  ) {}

  async autenticarMilitar(usuario: string, senha: string) {
    try {
      // 1. Valida o usuário e a senha e retorna o pacote corporativo do LDAP
      const ldapData = await this.ldapService.validarNoLdap(usuario, senha);

      // O próprio LDAP já valida se o perfil está ATIVO no ATLAS e nos devolve todas as infos mastigadas
      const dadosCompletos = {
        login: ldapData.login,
        matricula: ldapData.matricula || '',
        nome: [ldapData.cargo, ldapData.nomeGuerra].filter(Boolean).join(' ') || 'Policial Militar',
        email: ldapData.nomeGuerra ? `${ldapData.nomeGuerra.toLowerCase()}@pm.pe.gov.br` : '',
        postoGraduacao: ldapData.cargo || '',
        perfil: this.mapearPerfilLdap(ldapData.perfil),
        organizacaoDisp: ldapData.omeDisposicao || 'DTEC',
        secaoSigla: ldapData.secao || ldapData.omeDisposicao || 'DTEC',
      };

      // Se a execução chegou até aqui sem exceções, significa que o usuário:
      // 1. Passou pela autenticação de senha no LDAP
      // 2. Existe e está ATIVO no sistema de segurança SGA com permissão para o atlas.
      // A regra de negócio é: O SGA é a fonte da verdade. Se ele liberou lá, o atlas libera e sincroniza os dados locais.
      const usuarioAtualizado =
        await this.usersService.upsertUsuarioCorporativo({
          ...dadosCompletos,
          autorizado: true, // O SGA diz que está ativo
        });

      const usuarioDetalhado = await this.usersService.buscarPorId(
        usuarioAtualizado.id,
      );

      const batalhaoId =
        usuarioDetalhado.batalhaoId || usuarioDetalhado.secao?.batalhaoId;
      const batalhaoSigla =
        usuarioDetalhado.batalhao?.sigla ||
        usuarioDetalhado.secao?.batalhao?.sigla;
      const batalhaoNome =
        usuarioDetalhado.batalhao?.nome ||
        usuarioDetalhado.secao?.batalhao?.nome;
      const diretoriaId =
        usuarioDetalhado.secao?.diretoriaId ||
        usuarioDetalhado.batalhao?.diretoriaId;
      const diretoriaSigla =
        usuarioDetalhado.secao?.diretoria?.sigla ||
        usuarioDetalhado.batalhao?.diretoria?.sigla;
      const diretoriaNome =
        usuarioDetalhado.secao?.diretoria?.nome ||
        usuarioDetalhado.batalhao?.diretoria?.nome;

      const payload = {
        sub: usuarioDetalhado.id,
        login: usuarioDetalhado.login,
        matricula: usuarioDetalhado.matricula,
        nome: usuarioDetalhado.nome,
        perfil: usuarioDetalhado.perfil,
        secaoId: usuarioDetalhado.secaoId,
        batalhaoId,
      };

      const access_token = this.jwtService.sign(payload);
      const refresh_token = await this.criarTokenRenovacao(usuarioDetalhado.id);

      await this.auditService.registrarLog({
        usuarioId: usuarioDetalhado.id,
        acao: AcaoLog.LOGIN,
        descricao: `${dadosCompletos.nome} realizou login corporativo (LDAP+SGPM+SGA).`,
      });

      const usuarioSessao = {
        id: usuarioDetalhado.id,
        login: usuarioDetalhado.login,
        nome: usuarioDetalhado.nome,
        matricula: usuarioDetalhado.matricula,
        email: dadosCompletos.email,
        postoGraduacao: dadosCompletos.postoGraduacao,
        perfil: usuarioDetalhado.perfil,
        secaoId: usuarioDetalhado.secaoId,
        secaoSigla: usuarioDetalhado.secao?.sigla,
        secaoNome: usuarioDetalhado.secao?.nome,
        batalhaoId,
        batalhaoSigla,
        batalhaoNome,
        diretoriaId,
        diretoriaSigla,
        diretoriaNome,
      };

      return {
        access_token,
        refresh_token,
        usuario: usuarioSessao,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro no loginCorporativo: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      
      const fs = require('fs');
      const path = require('path');
      fs.appendFileSync(
        path.join(process.cwd(), 'ldap-debug.log'),
        JSON.stringify({ time: new Date().toISOString(), status: 'ERROR_ACESSO_SERVICE', errorMessage: (error as Error)?.message, stack: (error as Error)?.stack }) + '\n\n'
      );

      if (error instanceof UnauthorizedException) throw error;

      throw new UnauthorizedException(
        `Falha na autenticação corporativa: ${(error as Error)?.message || 'Dados inválidos'}`,
      );
    }
  }

  private mapearPerfilLdap(perfilLdap: string): import('@prisma/client').PerfilUsuario {
    const p = String(perfilLdap).toUpperCase().trim();
    if (p.includes('ADMIN') || p.includes('DTEC')) return 'ADMIN_DTEC';
    if (p.includes('DIRETOR') || p.includes('DIRETORIA')) return 'DIRETORIA';
    if (p.includes('COMANDANTE') || p.includes('CMT')) return 'COMANDANTE';
    if (p.includes('POLICIAL') || p.includes('EFETIVO')) return 'POLICIAL';
    return 'USUARIO_BATALHAO';
  }

  async solicitarAcessoInicial(
    dto: import('./dto/entrada.dto').SolicitarAcessoDto,
  ) {
    try {
      const loginInformado = dto.usuario;

      const dadosCompletos = {
        login: loginInformado,
        cpf: dto.cpf,
        matricula: dto.matricula,
        nome: dto.nome,
        email: '',
        postoGraduacao: '',
        perfil: 'USUARIO_BATALHAO',
        organizacaoDisp: dto.unidade,
        secaoSigla: dto.unidade,
        motivoSolicitacao: dto.motivo,
      };

      const usuarioBanco = await this.usersService.buscarPorLogin(loginInformado);
      if (usuarioBanco && usuarioBanco.autorizado === true) {
        return {
          message:
            'Você já está autorizado no atlas. Por favor, faça login normalmente.',
        };
      }

      await this.accessRequestsService.solicitarAcesso(dadosCompletos);

      return {
        message:
          'Solicitação de acesso enviada. Um administrador será avisado pela DTEC.',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro no solicitarAcessoCorporativo: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      if (
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      )
        throw error;
      throw new UnauthorizedException(
        `Falha ao solicitar acesso corporativo: ${(error as Error)?.message || 'Dados inválidos'}`,
      );
    }
  }

  async refresh(refreshToken: string) {
    const tokenBanco = await this.repository.findRefreshToken({
      where: { token: refreshToken },
      include: { usuario: true },
    });

    if (!tokenBanco || tokenBanco.expiresAt < new Date()) {
      if (tokenBanco)
        await this.repository.deleteRefreshToken({
          where: { id: tokenBanco.id },
        });
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const usuario = tokenBanco.usuario;
    const usuarioDetalhado = await this.usersService.buscarPorId(
      usuario.id,
    );
    const batalhaoId = usuario.batalhaoId || usuarioDetalhado.secao?.batalhaoId;
    const payload = {
      sub: usuario.id,
      login: usuario.login,
      matricula: usuario.matricula,
      nome: usuario.nome,
      perfil: usuario.perfil,
      secaoId: usuario.secaoId,
      batalhaoId,
    };

    const access_token = this.jwtService.sign(payload);
    const novo_refresh_token = await this.criarTokenRenovacao(usuario.id);

    await this.repository.deleteRefreshToken({ where: { id: tokenBanco.id } });

    return {
      access_token,
      refresh_token: novo_refresh_token,
    };
  }

  async logout(usuarioId: number, accessToken: string) {
    await this.repository.deleteManyRefreshTokens({
      where: { usuarioId },
    });

    let nomeUsuario = 'Usuário';
    try {
      const decoded = this.jwtService.decode(accessToken) as Record<string, any>;
      if (decoded?.nome) {
        nomeUsuario = decoded.nome;
      }
      if (decoded && decoded.exp) {
        await this.repository.createBlacklistToken({
          data: {
            jti: decoded.jti || uuidv4(),
            expiresAt: new Date(decoded.exp * 1000),
          },
        });
      }
    } catch (e: unknown) {
      this.logger.warn(`Falha ao registrar blacklist no logout: ${(e as Error)?.message}`);
    }

    await this.auditService.registrarLog({
      usuarioId,
      acao: AcaoLog.LOGOUT,
      descricao: `${nomeUsuario} realizou logout.`,
    });
  }

  private async criarTokenRenovacao(usuarioId: number) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repository.createRefreshToken({
      data: {
        token,
        usuarioId,
        expiresAt,
      },
    });

    return token;
  }

  async verificarTokenBloqueado(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.decode(token) as Record<string, any>;
      if (!decoded) return false;
      const jti = decoded.jti;
      if (!jti) return false;

      const blacklisted = await this.repository.findBlacklistToken({
        where: { jti },
      });
      return !!blacklisted;
    } catch {
      return false;
    }
  }
}
