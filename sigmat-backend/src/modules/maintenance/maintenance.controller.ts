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
    return this.MaintenanceService.criar(dados, usuario.id);
  }

  @Patch(':id/status')
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarStatusOsDto,
    @LoggedUser() usuario: any
  ) {
    return this.MaintenanceService.atualizarStatus(id, dados.status, dados, usuario.id);
  }
}






