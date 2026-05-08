import {
  Controller, Get, Post, Param, Body,
  ParseIntPipe, UseGuards
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoggedUser } from '../../common/decorators/logged-user.decorator';


@Controller('aprovacoes')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly ApprovalsService: ApprovalsService) {}

  @Get('pendentes')
  async listarPendentes(@LoggedUser() usuario: any) {
    const batalhaoId = usuario.perfil === 'ADMIN_DTEC' ? undefined : usuario.batalhaoId;
    return this.ApprovalsService.listarPendentesPorUnidade(batalhaoId);
  }

  @Get('contagem')
  async contarPendentes(@LoggedUser() usuario: any) {
    const batalhaoId = usuario.perfil === 'ADMIN_DTEC' ? undefined : usuario.batalhaoId;
    return { total: await this.ApprovalsService.contarPendentes(batalhaoId) };
  }

  @Post(':id/decisao')
  async processarDecisao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: { aprovado: boolean; justificativa?: string },
    @LoggedUser() usuario: any
  ) {
    return this.ApprovalsService.processarDecisao(
      id,
      dados.aprovado,
      usuario.id,
      dados.justificativa
    );
  }
}






