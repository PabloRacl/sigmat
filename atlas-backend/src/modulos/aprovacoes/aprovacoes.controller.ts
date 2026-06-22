import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApprovalsService } from './aprovacoes.service';
import { DecisionApprovalDto } from './dto/decision-approval.dto';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';

@Controller('aprovacoes')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly ApprovalsService: ApprovalsService) {}

  @Get('pendentes')
  async listarPendentes(@LoggedUser() usuario: any) {
    const batalhaoId =
      usuario.perfil === 'ADMIN_DTEC' ? undefined : usuario.batalhaoId;
    return this.ApprovalsService.listarPendentesPorUnidade(batalhaoId);
  }

  @Get()
  async listarTodas() {
    return this.ApprovalsService.listarTodas();
  }

  @Get('contagem')
  async contarPendentes(@LoggedUser() usuario: any) {
    const batalhaoId =
      usuario.perfil === 'ADMIN_DTEC' ? undefined : usuario.batalhaoId;
    return { total: await this.ApprovalsService.contarPendentes(batalhaoId) };
  }

  @Get('pendentes/contagem')
  async contarPendentesLegacy(@LoggedUser() usuario: any) {
    return this.contarPendentes(usuario);
  }

  @Get(':id')
  async obterPendencia(@Param('id', ParseIntPipe) id: number) {
    return this.ApprovalsService.obterPendencia(id);
  }

  @Post(':id/decisao')
  async processarDecisao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: DecisionApprovalDto,
    @LoggedUser() usuario: any,
  ) {
    return this.ApprovalsService.processarDecisao(
      id,
      dados.aprovado,
      usuario,
      dados.justificativa,
    );
  }
}
