import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './painel.service';
import { JwtAuthGuard } from '../autenticacao/guardas/jwt-autenticacao.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('estatisticas')
  async obterEstatisticas(@Request() req: any) {
    return this.dashboardService.obterEstatisticas(req.user);
  }

  @Get('atividades')
  async obterAtividades(@Request() req: any) {
    return this.dashboardService.obterAtividadesRecentes(req.user);
  }
}
