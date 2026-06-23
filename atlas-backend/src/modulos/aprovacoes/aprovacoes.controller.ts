import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApprovalsService } from './aprovacoes.service';
import { DecisionApprovalDto } from './dto/decision-approval.dto';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';

@ApiTags('Aprovações')
@ApiBearerAuth()
@Controller('aprovacoes')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly ApprovalsService: ApprovalsService) {}

  @Get('pendentes')
  @ApiOperation({ summary: 'Listar alterações pendentes (filtrado por unidade)' })
  async listarPendentes(@LoggedUser() usuario: any) {
    const batalhaoId =
      usuario.perfil === 'ADMIN_DTEC' ? undefined : usuario.batalhaoId;
    return this.ApprovalsService.listarPendentesPorUnidade(batalhaoId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as alterações' })
  async listarTodas() {
    return this.ApprovalsService.listarTodas();
  }

  @Get('contagem')
  @ApiOperation({ summary: 'Contar quantidade de pendências' })
  async contarPendentes(@LoggedUser() usuario: any) {
    const batalhaoId =
      usuario.perfil === 'ADMIN_DTEC' ? undefined : usuario.batalhaoId;
    return { total: await this.ApprovalsService.contarPendentes(batalhaoId) };
  }

  @Get('pendentes/contagem')
  @ApiOperation({ summary: 'Contar pendências (rota legada)' })
  async contarPendentesLegacy(@LoggedUser() usuario: any) {
    return this.contarPendentes(usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma pendência específica' })
  async obterPendencia(@Param('id', ParseIntPipe) id: number) {
    return this.ApprovalsService.obterPendencia(id);
  }

  @Post(':id/decisao')
  @ApiOperation({ summary: 'Aprovar ou rejeitar uma alteração pendente' })
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
