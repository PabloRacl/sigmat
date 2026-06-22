import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AcessoService } from './acesso.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AcessoService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret)
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: Record<string, any>) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const isBlacklisted = await this.authService.verificarTokenBloqueado(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revogado (Logout realizado).');
      }
    }

    return {
      id: payload.sub,
      login: payload.login,
      matricula: payload.matricula,
      nome: payload.nome,
      perfil: payload.perfil,
      secaoId: payload.secaoId,
      batalhaoId: payload.batalhaoId,
    };
  }
}
