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

import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LdapService } from '../../integrations/ldap/ldap.service';
import { SgaService } from '../../integrations/sga/sga.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../../shared/services/audit.service';
import { AcaoLog } from '@prisma/client';
import { AuthRepository } from './auth.repository';
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

      // 4. Sincroniza o usuário localmente na base do SIGMAT
      const usuarioBanco = await this.usersService.upsertUsuarioCorporativo(dadosCompletos);

      const payload = {
        sub: usuarioBanco.id,
        login: usuarioBanco.login,
        matricula: usuarioBanco.matricula,
        nome: usuarioBanco.nome,
        perfil: usuarioBanco.perfil,
        secaoId: usuarioBanco.secaoId,
        batalhaoId: usuarioBanco.batalhaoId,
      };

      const access_token = this.jwtService.sign(payload);
      const refresh_token = await this.gerarRefreshToken(usuarioBanco.id);

      await this.auditService.registrarLog({
        usuarioId: usuarioBanco.id,
        acao: AcaoLog.LOGIN,
        descricao: `Usuário ${usuarioBanco.login} realizou login corporativo real (LDAP+SGPM+SGA).`,
      });

      return {
        access_token,
        refresh_token,
        usuario: {
          id: usuarioBanco.id,
          login: usuarioBanco.login,
          nome: usuarioBanco.nome,
          matricula: usuarioBanco.matricula,
          perfil: usuarioBanco.perfil,
          secaoId: usuarioBanco.secaoId,
        }
      };

    } catch (error) {
      this.logger.error(`Erro no loginCorporativo: ${error?.message}`, error?.stack);
      if (error instanceof UnauthorizedException) throw error;
      
      throw new UnauthorizedException(`Falha na autenticação corporativa: ${error?.message || 'Dados inválidos'}`);
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
    const payload = {
      sub: usuario.id,
      login: usuario.login,
      matricula: usuario.matricula,
      nome: usuario.nome,
      perfil: usuario.perfil,
      secaoId: usuario.secaoId,
      batalhaoId: usuario.batalhaoId,
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
