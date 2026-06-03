import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './relatorios.service';
import { JwtAuthGuard } from '../autenticacao/guardas/jwt-autenticacao.guard';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';

@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventario')
  async inventario(@Query() filtros: any, @LoggedUser() usuario: any) {
    return this.reportsService.inventarioGeral(filtros, usuario);
  }

  @Get('resumo-unidades')
  async resumoUnidades(@LoggedUser() usuario: any) {
    return this.reportsService.resumoPorUnidade(usuario);
  }

  @Get('transferencias')
  async transferencias(@Query() filtros: any, @LoggedUser() usuario: any) {
    return this.reportsService.transferencias(filtros, usuario);
  }

  @Get('auditoria')
  async auditoria(@Query() query: any, @LoggedUser() usuario: any) {
    // Accept query filters: dias, acao, usuario, patrimonio, descricao, startDate, endDate
    return this.reportsService.logsAuditoria(query, usuario);
  }
}





