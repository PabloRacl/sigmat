import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccessRequestsService } from './solicitacoes-acesso.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';

@ApiTags('Solicitações de Acesso')
@ApiBearerAuth()
@Controller('solicitacoes-acesso')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_DTEC')
export class AccessRequestsController {
  constructor(private readonly accessRequestsService: AccessRequestsService) {}

  @Get('pendentes')
  @ApiOperation({ summary: 'Listar todas solicitações de acesso pendentes' })
  async listarPendentes() {
    return this.accessRequestsService.listarPendentes();
  }

  @Patch(':id/aprovar')
  @ApiOperation({ summary: 'Aprovar solicitação de acesso e conceder perfil' })
  async aprovar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dadosCuradoria: { perfil?: string; secaoId?: number; batalhaoId?: number }
  ) {
    return this.accessRequestsService.aprovar(id, dadosCuradoria);
  }

  @Patch(':id/rejeitar')
  @ApiOperation({ summary: 'Rejeitar solicitação de acesso' })
  async rejeitar(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo?: string,
  ) {
    return this.accessRequestsService.rejeitar(id, motivo);
  }
}
