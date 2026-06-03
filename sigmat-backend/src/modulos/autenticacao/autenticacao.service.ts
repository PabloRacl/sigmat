/**
 * [Estado Atual]: Serviço de negócios para autenticação, controle de sessões e revogação de tokens.
 * [Dependências Técnicas]:
 *   - AuthRepository
 *   - LdapService, SgaService, UsersService, JwtService, AuditService
 * [Histórico de Modificações]:
 *   - Refatorado para o padrão Repository/Service, eliminando acoplamento com o PrismaClient.
 *   - Totalmente integrado com o fluxo corporativo real (LDAP, SGPM e SGA).
 * [Regras de Negócio Imutáveis]:
 *   - Validação corporativa baseada no LDAP local + permissão de perfil via SGA + dados cadastrais via SGPM.
 *   - Rotação estrita de Refresh Tokens de 7 dias de validade.
 *   - Lista negra (blacklist) para invalidação imediata de JWTs expirados ou revogados.
 */

import { Injectable, UnauthorizedException, Logger, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LdapService } from '../../integracoes/ldap/ldap.service';
import { SgaService } from '../../integracoes/sga/sga.service';
import { UsersService } from '../usuarios/usuarios.service';
import { AuditService } from '../../compartilhado/servicos/audit.service';
import { AcaoLog } from '@prisma/client';
import { AuthRepository } from './autenticacao.repository';
import { AccessRequestsService } from '../solicitacoes-acesso/solicitacoes-acesso.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly ldapService: LdapService,
    private readonly sgaService: SgaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly repository: AuthRepository,
    private readonly accessRequestsService: AccessRequestsService,
  ) {}

  async loginCorporativo(usuario: string, senha: string) {
    try {
      // 1. Valida o usuário e a senha e retorna o CPF verificado no LDAP corporativo
      const cpfLdap = await this.ldapService.autenticar(usuario, senha);

      // 2. Consulta os dados funcionais adicionais do militar no SGPM
      const sgpmData = await this.sgaService.obterDadosSgpm(cpfLdap);

      // 3. Consulta as permissões ativas e perfis do militar no SGA
      const sgaPermissao = await this.sgaService.obterPermissao(cpfLdap);

      const dadosCompletos = {
        login: cpfLdap, // o CPF é usado como login único
        matricula: sgpmData.matricula || '',
        nome: sgpmData.nome_completo || sgpmData.nome_guerra || 'Policial Militar',
        email: `${sgpmData.nome_guerra?.toLowerCase() || 'policial'}@pm.pe.gov.br`,
        postoGraduacao: sgpmData.sigla || '',
        perfil: sgaPermissao.perfil,
        organizacaoDisp: sgpmData.organizacao_disp || 'DTEC',
        secaoSigla: sgpmData.secao || sgpmData.organizacao_disp || 'DTEC',
      };

      const usuarioBanco = await this.usersService.buscarPorLogin(cpfLdap);
      if (!usuarioBanco) {
        throw new UnauthorizedException(
          'Usuário válido no SGA, mas sem autorização no SIGMAT. Solicite acesso para ser liberado.'
        );
      }

      if (usuarioBanco.autorizado === false) {
        throw new UnauthorizedException(
          'Seu acesso está pendente de aprovação. Aguarde o retorno da DTEC.'
        );
      }

      const usuarioAtualizado: any = await this.usersService.atualizar(usuarioBanco.id, {
        nome: dadosCompletos.nome,
        email: dadosCompletos.email,
        postoGraduacao: dadosCompletos.postoGraduacao,
        matricula: dadosCompletos.matricula,
        perfil: dadosCompletos.perfil,
        ...(usuarioBanco.secaoId != null ? { secaoId: usuarioBanco.secaoId } : {}),
        ...(usuarioBanco.batalhaoId != null ? { batalhaoId: usuarioBanco.batalhaoId } : {}),
      });

      const usuarioDetalhado: any = await this.usersService.buscarPorId(usuarioAtualizado.id);

      const batalhaoId = usuarioDetalhado.batalhaoId || usuarioDetalhado.secao?.batalhaoId;
      const batalhaoSigla = usuarioDetalhado.batalhao?.sigla || usuarioDetalhado.secao?.batalhao?.sigla;
      const batalhaoNome = usuarioDetalhado.batalhao?.nome || usuarioDetalhado.secao?.batalhao?.nome;
      const diretoriaId = usuarioDetalhado.secao?.diretoriaId || usuarioDetalhado.batalhao?.diretoriaId;
      const diretoriaSigla = usuarioDetalhado.secao?.diretoria?.sigla || usuarioDetalhado.batalhao?.diretoria?.sigla;
      const diretoriaNome = usuarioDetalhado.secao?.diretoria?.nome || usuarioDetalhado.batalhao?.diretoria?.nome;

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
      const refresh_token = await this.gerarRefreshToken(usuarioDetalhado.id);

      await this.auditService.registrarLog({
        usuarioId: usuarioDetalhado.id,
        acao: AcaoLog.LOGIN,
        descricao: `Usuário ${usuarioDetalhado.login} realizou login corporativo real (LDAP+SGPM+SGA).`,
      });

      const usuarioSessao = {
        id: usuarioDetalhado.id,
        login: usuarioDetalhado.login,
        nome: usuarioDetalhado.nome,
        matricula: usuarioDetalhado.matricula,
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

    } catch (error: any) {
      this.logger.error(`Erro no loginCorporativo: ${error?.message}`, error?.stack);
      if (error instanceof UnauthorizedException) throw error;
      
      throw new UnauthorizedException(`Falha na autenticação corporativa: ${error?.message || 'Dados inválidos'}`);
    }
  }

  async solicitarAcessoCorporativo(dto: import('./dto/entrada.dto').SolicitarAcessoDto) {
    try {
      const isMock = process.env.USE_MOCK_AUTH === 'true';
      let cpfLdap = dto.cpf;
      let sgpmData: any = {};
      let sgaPermissao: any = { perfil: 'USUARIO_BATALHAO' };

      if (!isMock) {
        cpfLdap = await this.ldapService.autenticar(dto.cpf, dto.senha);
        sgpmData = await this.sgaService.obterDadosSgpm(cpfLdap).catch(() => ({}));
        sgaPermissao = await this.sgaService.obterPermissao(cpfLdap).catch(() => ({ perfil: 'USUARIO_BATALHAO' }));
      }

      const dadosCompletos = {
        login: dto.cpf,
        cpf: dto.cpf,
        matricula: dto.matricula || sgpmData.matricula || '',
        nome: dto.nome || sgpmData.nome_completo || sgpmData.nome_guerra || 'Policial Militar',
        email: `${sgpmData.nome_guerra?.toLowerCase() || 'policial'}@pm.pe.gov.br`,
        postoGraduacao: sgpmData.sigla || '',
        perfil: sgaPermissao.perfil,
        organizacaoDisp: dto.unidade || sgpmData.organizacao_disp || 'DTEC',
        secaoSigla: dto.unidade || sgpmData.secao || sgpmData.organizacao_disp || 'DTEC',
      };

      const usuarioBanco = await this.usersService.buscarPorLogin(cpfLdap);
      if (usuarioBanco && usuarioBanco.autorizado === true) {
        return {
          message: 'Você já está autorizado no SIGMAT. Por favor, faça login normalmente.',
        };
      }

      await this.accessRequestsService.solicitarAcesso(dadosCompletos);

      return {
        message: 'Solicitação de acesso enviada. Um administrador será avisado pela DTEC.',
      };
    } catch (error: any) {
      this.logger.error(`Erro no solicitarAcessoCorporativo: ${error?.message}`, error?.stack);
      if (error instanceof UnauthorizedException || error instanceof ConflictException) throw error;
      throw new UnauthorizedException(`Falha ao solicitar acesso corporativo: ${error?.message || 'Dados inválidos'}`);
    }
  }

  async refresh(refreshToken: string) {
    const tokenBanco = await this.repository.findRefreshToken({
      where: { token: refreshToken },
      include: { usuario: true }
    });

    if (!tokenBanco || tokenBanco.expiresAt < new Date()) {
      if (tokenBanco) await this.repository.deleteRefreshToken({ where: { id: tokenBanco.id } });
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const usuario = tokenBanco.usuario;
    const usuarioDetalhado: any = await this.usersService.buscarPorId(usuario.id);
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
    const novo_refresh_token = await this.gerarRefreshToken(usuario.id);

    await this.repository.deleteRefreshToken({ where: { id: tokenBanco.id } });

    return {
      access_token,
      refresh_token: novo_refresh_token
    };
  }

  async logout(usuarioId: number, accessToken: string) {
    await this.repository.deleteManyRefreshTokens({
      where: { usuarioId }
    });

    try {
      const decoded: any = this.jwtService.decode(accessToken);
      if (decoded && decoded.exp) {
        await this.repository.createBlacklistToken({
          data: {
            jti: decoded.jti || uuidv4(),
            expiresAt: new Date(decoded.exp * 1000)
          }
        });
      }
    } catch (e) {}

    await this.auditService.registrarLog({
      usuarioId,
      acao: AcaoLog.LOGOUT,
      descricao: `Usuário realizou logout.`,
    });
  }

  private async gerarRefreshToken(usuarioId: number) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repository.createRefreshToken({
      data: {
        token,
        usuarioId,
        expiresAt
      }
    });

    return token;
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded: any = this.jwtService.decode(token);
      if (!decoded) return false;
      const jti = decoded.jti;
      if (!jti) return false;

      const blacklisted = await this.repository.findBlacklistToken({
        where: { jti }
      });
      return !!blacklisted;
    } catch {
      return false;
    }
  }
}
