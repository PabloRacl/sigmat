import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './painel.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('estatisticas')
  async obterEstatisticas(@LoggedUser() usuario: UsuarioLogado) {
    return this.dashboardService.obterEstatisticas(usuario);
  }

  @Get('atividades')
  async obterAtividades(@LoggedUser() usuario: UsuarioLogado) {
    return this.dashboardService.obterAtividadesRecentes(usuario);
  }
}
