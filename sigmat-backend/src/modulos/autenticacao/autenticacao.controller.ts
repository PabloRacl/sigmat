/**
 * [Estado Atual]: Controlador REST para autenticação corporativa (login, logout, rotação de refresh token).
 * [Dependências Técnicas]:
 *   - AuthService
 *   - LoginDto, JwtAuthGuard, Throttle
 * [Histórico de Modificações]:
 *   - Adicionado cabeçalho de contexto arquitetural de alta eficiência de tokens.
 * [Regras de Negócio Imutáveis]:
 *   - Rate limiting (Throttle) para proteção contra brute force na rota de login.
 *   - Logout e refresh de token devem invalidar as credenciais ativas correspondentes.
 */

import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './autenticacao.service';
import { LoginDto, SolicitarAcessoDto } from './dto/entrada.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guardas/jwt-autenticacao.guard';

@Controller('autenticacao')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login-sei')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.loginCorporativo(body.usuario, body.senha);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('solicitar-acesso')
  @HttpCode(HttpStatus.OK)
  async solicitarAcesso(@Body() body: SolicitarAcessoDto) {
    return this.authService.solicitarAcessoCorporativo(body);
  }

  @Get('debug-ping')
  async ping() {
    return { status: "Code Version: 1.0.1 - Debug Enabled", time: new Date().toISOString() };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    return this.authService.logout(req.user.id, token);
  }
}







