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

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './autenticacao.service';
import { LoginDto, SolicitarAcessoDto } from './dto/entrada.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guardas/jwt-autenticacao.guard';
import { LocalAuthGuard } from './guardas/local-auth.guard';
import { SgaService } from '../../integracoes/sga/sga.service';

@Controller('autenticacao')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sgaService: SgaService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login-sei')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: any) {
    return req.user;
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('solicitar-acesso')
  @HttpCode(HttpStatus.OK)
  async solicitarAcesso(@Body() body: SolicitarAcessoDto) {
    return this.authService.solicitarAcessoCorporativo(body);
  }

  @Get('unidades')
  async listarUnidades() {
    const unidades = await this.sgaService.listarUnidades();
    return { unidades };
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
