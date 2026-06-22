import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './relatorios.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';

@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventario')
  async inventario(@Query() filtros: Record<string, string>, @LoggedUser() usuario: UsuarioLogado) {
    return this.reportsService.inventarioGeral(filtros, usuario);
  }

  @Get('resumo-unidades')
  async resumoUnidades(@LoggedUser() usuario: UsuarioLogado) {
    return this.reportsService.resumoPorUnidade(usuario);
  }

  @Get('transferencias')
  async transferencias(@Query() filtros: Record<string, string>, @LoggedUser() usuario: UsuarioLogado) {
    return this.reportsService.transferencias(filtros, usuario);
  }

  @Get('auditoria')
  async auditoria(@Query() query: Record<string, string>, @LoggedUser() usuario: UsuarioLogado) {
    // Accept query filters: dias, acao, usuario, patrimonio, descricao, startDate, endDate
    return this.reportsService.logsAuditoria(query, usuario);
  }

  @Post('log')
  async registrarLog(
    @Body() body: { acao: string; detalhes: Record<string, unknown>; dataHora?: string },
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    // Registra log de auditoria para ações administrativas
    console.log(`[AUDITORIA] ${body.acao} por ${usuario.nome} (${usuario.perfil}) em ${body.dataHora || new Date().toISOString()}`, body.detalhes);
    return { registrado: true, acao: body.acao, timestamp: body.dataHora || new Date().toISOString() };
  }
}
