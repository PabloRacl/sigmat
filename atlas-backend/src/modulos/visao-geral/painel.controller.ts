import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './painel.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';

@ApiTags('Painel / Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter contadores e estatísticas principais do painel' })
  async obterEstatisticas(@LoggedUser() usuario: UsuarioLogado) {
    return this.dashboardService.obterEstatisticas(usuario);
  }

  @Get('atividades')
  @ApiOperation({ summary: 'Obter linha do tempo de atividades recentes' })
  async obterAtividades(@LoggedUser() usuario: UsuarioLogado) {
    return this.dashboardService.obterAtividadesRecentes(usuario);
  }
}
