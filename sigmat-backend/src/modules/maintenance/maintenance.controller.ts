/**
 * [Estado Atual]: Controlador REST para gerenciamento de Ordens de Serviço (Manutenção).
 * [Dependências Técnicas]: Consome MaintenanceService; Interage via JWT Auth.
 * [Histórico de Modificações]: Refatoração para Clean Code - Isolamento do banco de dados concluído.
 * [Regras de Negócio Imutáveis]: Não importar PrismaClient; Validar DTOs rigorosamente.
 */
import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoggedUser } from '../../common/decorators/logged-user.decorator';

import { CriarOrdemServicoDto, AtualizarStatusOsDto } from './dto/maintenance.dto';

@Controller('manutencao')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly MaintenanceService: MaintenanceService) {}

  @Get()
  listarTodos(@LoggedUser() usuario: any) {
    return this.MaintenanceService.listarTodos(usuario);
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.MaintenanceService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dados: CriarOrdemServicoDto, @LoggedUser() usuario: any) {
    return this.MaintenanceService.criar(dados, usuario);
  }

  @Post('massa')
  criarMassa(@Body() dados: any, @LoggedUser() usuario: any) {
    return this.MaintenanceService.criarMassa(dados, usuario);
  }

  @Patch(':id/status')
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarStatusOsDto,
    @LoggedUser() usuario: any
  ) {
    return this.MaintenanceService.atualizarStatus(id, dados.status, dados, usuario);
  }

  @Get(':id/historico')
  obterHistorico(@Param('id', ParseIntPipe) id: number) {
    return this.MaintenanceService.obterHistorico(id);
  }
}






