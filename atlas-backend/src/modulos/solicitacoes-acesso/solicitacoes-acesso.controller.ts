import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { AccessRequestsService } from './solicitacoes-acesso.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';

@Controller('solicitacoes-acesso')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_DTEC')
export class AccessRequestsController {
  constructor(private readonly accessRequestsService: AccessRequestsService) {}

  @Get('pendentes')
  async listarPendentes() {
    return this.accessRequestsService.listarPendentes();
  }

  @Patch(':id/aprovar')
  async aprovar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dadosCuradoria: { perfil?: string; secaoId?: number; batalhaoId?: number }
  ) {
    return this.accessRequestsService.aprovar(id, dadosCuradoria);
  }

  @Patch(':id/rejeitar')
  async rejeitar(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo?: string,
  ) {
    return this.accessRequestsService.rejeitar(id, motivo);
  }
}
