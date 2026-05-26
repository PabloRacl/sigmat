import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LdapService } from '../../integrations/ldap/ldap.service';
import { SgaService } from '../../integrations/sga/sga.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../../shared/services/audit.service';
import { AcaoLog } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
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
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Realiza o login corporativo integrado com o LDAP e o SGA (Portal de Segurança).
   */
  async loginCorporativo(usuario: string, senha: string) {
    try {
      // 1. Valida as credenciais na API LDAP corporativa
      const dadosLdap = await this.ldapService.autenticar(usuario, senha);

      // 2. Consulta a liberação de acesso e o perfil do policial no SGA
      const permissaoSga = await this.sgaService.obterPermissao(dadosLdap.matricula || usuario);

      if (!permissaoSga.ativo) {
        throw new UnauthorizedException('Sua conta não está ativa no Portal de Segurança (SGA).');
      }

      // Mescla os dados cadastrais do LDAP com o perfil de acesso do SGA
      const dadosCompletos = {
        ...dadosLdap,
        perfil: permissaoSga.perfil,
        unidade: dadosLdap.unidade || 'DTEC' // default/fallback
      };

      // 3. Garante que o usuário existe no banco local com os perfis corretos
      const usuarioBanco = await this.usersService.upsertUsuarioCorporativo(dadosCompletos);

      // 4. Gera o token JWT com as informações do banco
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

      // 5. Log de auditoria
      await this.auditService.registrarLog({
        usuarioId: usuarioBanco.id,
        acao: AcaoLog.LOGIN,
        descricao: `Usuário ${usuarioBanco.login} realizou login corporativo (LDAP+SGA).`,
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
      
      throw new InternalServerErrorException(`Erro no servidor de autenticação: ${error?.message || 'Sem resposta'}`);
    }
  }

  async refresh(refreshToken: string) {
    const tokenBanco = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { usuario: true }
    });

    if (!tokenBanco || tokenBanco.expiresAt < new Date()) {
      if (tokenBanco) await this.prisma.refreshToken.delete({ where: { id: tokenBanco.id } });
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

    // Remove o token antigo (Rotação de Refresh Token)
    await this.prisma.refreshToken.delete({ where: { id: tokenBanco.id } });

    return {
      access_token,
      refresh_token: novo_refresh_token
    };
  }

  async logout(usuarioId: number, accessToken: string) {
    // 1. Invalida os Refresh Tokens do usuário
    await this.prisma.refreshToken.deleteMany({
      where: { usuarioId }
    });

    // 2. Opcional: Adicionar o access_token atual à lista negra
    try {
      const decoded: any = this.jwtService.decode(accessToken);
      if (decoded && decoded.exp) {
        await this.prisma.tokenBlacklist.create({
          data: {
            jti: decoded.jti || uuidv4(), // Se não houver JTI, usamos o token como identificador único ou geramos um
            expiresAt: new Date(decoded.exp * 1000)
          }
        });
      }
    } catch (e) {
      // Ignora erro se não conseguir decodificar
    }

    await this.auditService.registrarLog({
      usuarioId,
      acao: AcaoLog.LOGOUT,
      descricao: `Usuário realizou logout.`,
    });
  }

  private async gerarRefreshToken(usuarioId: number) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    await this.prisma.refreshToken.create({
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

      const blacklisted = await this.prisma.tokenBlacklist.findUnique({
        where: { jti }
      });
      return !!blacklisted;
    } catch {
      return false;
    }
  }
}





