/**
 * [Estado Atual]: ServiÃ§o de negÃ³cios para autenticaÃ§Ã£o, controle de sessÃµes e revogaÃ§Ã£o de tokens.
 * [DependÃªncias TÃ©cnicas]:
 *   - AuthRepository
 *   - LdapService, SgaService, UsersService, JwtService, AuditService
 * [HistÃ³rico de ModificaÃ§Ãµes]:
 *   - Refatorado para o padrÃ£o Repository/Service, eliminando acoplamento com o PrismaClient.
 *   - Totalmente integrado com o fluxo corporativo real (LDAP, SGPM e SGA).
 * [Regras de NegÃ³cio ImutÃ¡veis]:
 *   - ValidaÃ§Ã£o corporativa baseada no LDAP local + permissÃ£o de perfil via SGA + dados cadastrais via SGPM.
 *   - RotaÃ§Ã£o estrita de Refresh Tokens de 7 dias de validade.
 *   - Lista negra (blacklist) para invalidaÃ§Ã£o imediata de JWTs expirados ou revogados.
 */

import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
} from '@nestjs/common';
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
      // 1. Valida o usuÃ¡rio e a senha e retorna o CPF verificado no LDAP corporativo
      const cpfLdap = await this.ldapService.autenticar(usuario, senha);

      // 2. Consulta os dados funcionais adicionais do militar no SGPM
      const sgpmData = await this.sgaService.obterDadosSgpm(cpfLdap);

      // 3. Consulta as permissÃµes ativas e perfis do militar no SGA
      const sgaPermissao = await this.sgaService.obterPermissao(cpfLdap);

      const dadosCompletos = {
        login: cpfLdap, // o CPF Ã© usado como login Ãºnico
        matricula: sgpmData.matricula || '',
        nome: [sgpmData.sigla, sgpmData.nome_guerra].filter(Boolean).join(' ') || 'Policial Militar',
        email: '',
        postoGraduacao: sgpmData.sigla || '',
        perfil: sgaPermissao.perfil,
        organizacaoDisp: sgpmData.organizacao_disp || 'DTEC',
        secaoSigla: sgpmData.secao || sgpmData.organizacao_disp || 'DTEC',
      };

      // Se a execuÃ§Ã£o chegou atÃ© aqui sem exceÃ§Ãµes, significa que o usuÃ¡rio:
      // 1. Passou pela autenticaÃ§Ã£o de senha no LDAP
      // 2. Existe e estÃ¡ ATIVO no sistema de seguranÃ§a SGA com permissÃ£o para o atlas.
      // A regra de negÃ³cio Ã©: O SGA Ã© a fonte da verdade. Se ele liberou lÃ¡, o atlas libera e sincroniza os dados locais.
      const usuarioAtualizado: any =
        await this.usersService.upsertUsuarioCorporativo({
          ...dadosCompletos,
          autorizado: true, // O SGA diz que estÃ¡ ativo
        });

      const usuarioDetalhado: any = await this.usersService.buscarPorId(
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
      const refresh_token = await this.gerarRefreshToken(usuarioDetalhado.id);

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
    } catch (error: any) {
      this.logger.error(
        `Erro no loginCorporativo: ${error?.message}`,
        error?.stack,
      );
      if (error instanceof UnauthorizedException) throw error;

      throw new UnauthorizedException(
        `Falha na autenticaÃ§Ã£o corporativa: ${error?.message || 'Dados invÃ¡lidos'}`,
      );
    }
  }

  async solicitarAcessoCorporativo(
    dto: import('./dto/entrada.dto').SolicitarAcessoDto,
  ) {
    try {
      const isMock = process.env.USE_MOCK_AUTH === 'true';
      let cpfLdap = dto.cpf;
      let sgpmData: any = {};
      let sgaPermissao: any = { perfil: 'USUARIO_BATALHAO' };

      if (!isMock) {
        // Usa o campo 'usuario' diretamente, igual ao login principal
        cpfLdap = await this.ldapService.autenticar(dto.usuario, dto.senha);
        sgpmData = await this.sgaService
          .obterDadosSgpm(cpfLdap)
          .catch(() => ({}));
        sgaPermissao = await this.sgaService
          .obterPermissao(cpfLdap)
          .catch(() => ({ perfil: 'USUARIO_BATALHAO' }));
      }

      const dadosCompletos = {
        login: cpfLdap, // CPF real retornado pelo LDAP
        cpf: cpfLdap,
        matricula: sgpmData.matricula || dto.matricula || '',
        nome: [sgpmData.sigla, sgpmData.nome_guerra].filter(Boolean).join(' ') || dto.nome || 'Policial Militar',
        email: '',
        postoGraduacao: sgpmData.sigla || '',
        perfil: sgaPermissao.perfil,
        organizacaoDisp: sgpmData.organizacao_disp || dto.unidade || 'DTEC',
        secaoSigla:
          sgpmData.secao || sgpmData.organizacao_disp || dto.unidade || 'DTEC',
      };

      const usuarioBanco = await this.usersService.buscarPorLogin(cpfLdap);
      if (usuarioBanco && usuarioBanco.autorizado === true) {
        return {
          message:
            'VocÃª jÃ¡ estÃ¡ autorizado no atlas. Por favor, faÃ§a login normalmente.',
        };
      }

      await this.accessRequestsService.solicitarAcesso(dadosCompletos);

      return {
        message:
          'SolicitaÃ§Ã£o de acesso enviada. Um administrador serÃ¡ avisado pela DTEC.',
      };
    } catch (error: any) {
      this.logger.error(
        `Erro no solicitarAcessoCorporativo: ${error?.message}`,
        error?.stack,
      );
      if (
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      )
        throw error;
      throw new UnauthorizedException(
        `Falha ao solicitar acesso corporativo: ${error?.message || 'Dados invÃ¡lidos'}`,
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
      throw new UnauthorizedException('Refresh token invÃ¡lido ou expirado.');
    }

    const usuario = tokenBanco.usuario;
    const usuarioDetalhado: any = await this.usersService.buscarPorId(
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
    const novo_refresh_token = await this.gerarRefreshToken(usuario.id);

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
      const decoded: any = this.jwtService.decode(accessToken);
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
    } catch (e) {}

    await this.auditService.registrarLog({
      usuarioId,
      acao: AcaoLog.LOGOUT,
      descricao: `${nomeUsuario} realizou logout.`,
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
        expiresAt,
      },
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
        where: { jti },
      });
      return !!blacklisted;
    } catch {
      return false;
    }
  }
}
