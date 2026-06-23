/**
 * [Estado Atual]: Controlador REST para autenticação corporativa (login, logout, rotação de refresh token).
 * [Dependências Técnicas]:
 *   - AcessoService
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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AcessoService } from './acesso.service';
import { LoginDto, SolicitarAcessoDto } from './dto/entrada.dto';
import type { Request } from 'express';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guardas/jwt-autenticacao.guard';
import { LocalAuthGuard } from './guardas/local-auth.guard';
import { BasesCorporativasService } from '../../integracoes/bases-corporativas/bases-corporativas.service';

@ApiTags('Autenticação')
@Controller('autenticacao')
export class AcessoController {
  constructor(
    private readonly authService: AcessoService,
    private readonly sgaService: BasesCorporativasService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login-sei')
  @ApiOperation({ summary: 'Login com credenciais corporativas (SEI/LDAP)' })
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request) {
    return req.user;
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('solicitar-acesso')
  @ApiOperation({ summary: 'Solicitar acesso inicial ao sistema' })
  @HttpCode(HttpStatus.OK)
  async solicitarAcesso(@Body() body: SolicitarAcessoDto) {
    return this.authService.solicitarAcessoInicial(body);
  }

  @Get('unidades')
  @ApiOperation({ summary: 'Listar unidades disponíveis para cadastro' })
  async listarUnidades() {
    const unidades = await this.sgaService.listarUnidades();
    return { unidades };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Atualizar token JWT expirado usando o refresh token' })
  @ApiBody({ schema: { type: 'object', properties: { refresh_token: { type: 'string' } } } })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e invalidar token atual' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return;
    const token = authHeader.split(' ')[1];
    const user = req.user as unknown as UsuarioLogado;
    if (!user || !user.id) return;
    return this.authService.logout(user.id, token);
  }
}
