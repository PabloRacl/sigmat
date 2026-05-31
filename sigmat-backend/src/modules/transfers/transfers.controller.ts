/**
 * [Estado Atual]: Controlador REST para gerenciamento de solicitações e movimentações de carga (transferências).
 * [Dependências Técnicas]:
 *   - TransfersService
 * [Histórico de Modificações]:
 *   - Adicionado cabeçalho de contexto arquitetural de alta eficiência de tokens.
 * [Regras de Negócio Imutáveis]:
 *   - Rotas protegidas por JwtAuthGuard.
 *   - Controle estrito de acesso e delegação de lógica ao TransfersService.
 */

import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoggedUser } from '../../common/decorators/logged-user.decorator';


@Controller('transferencias')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private TransfersService: TransfersService) {}

  @Post('solicitar')
  solicitar(
    @Body() body: { equipamentoId: number; destinoId: number; observacao?: string },
    @LoggedUser() usuario: any,
  ) {
    return this.TransfersService.solicitar(
      body.equipamentoId,
      body.destinoId,
      usuario.id,
      usuario,
      body.observacao,
    );
  }

  @Post('solicitar-massa')
  solicitarMassa(
    @Body() body: {
      equipamentoIds: number[];
      destinoId: number;
      observacao?: string;
      disponibilidadeId?: number;
      solicitante?: string;
      dataSolicitacao?: string;
      dataRetornoEmprestimo?: string;
    },
    @LoggedUser() usuario: any,
  ) {
    return this.TransfersService.solicitarEmMassa(
      body.equipamentoIds,
      body.destinoId,
      usuario.id,
      usuario,
      body.observacao,
      body.disponibilidadeId,
      body.solicitante,
      body.dataSolicitacao,
      body.dataRetornoEmprestimo,
    );
  }

  @Get('pendentes')
  listarPendentes(@LoggedUser() usuario: any) {
    return this.TransfersService.listarPendentesPorUsuario(usuario);
  }

  @Post(':id/confirmar')
  confirmar(
    @Param('id', ParseIntPipe) id: number,
    @LoggedUser() usuario: any,
  ) {
    return this.TransfersService.confirmarRecebimento(id, usuario);
  }

  @Post(':id/cancelar')
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @LoggedUser() usuario: any
  ) {
    return this.TransfersService.cancelar(id, usuario);
  }
}






