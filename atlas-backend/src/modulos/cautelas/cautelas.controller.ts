import {
  Controller, Get, Post, Param, Body,
  ParseIntPipe, UseGuards, Request
} from '@nestjs/common';
import { LoansService } from './cautelas.service';
import { JwtAuthGuard } from '../autenticacao/guardas/jwt-autenticacao.guard';

@Controller('emprestimos')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly LoansService: LoansService) {}

  @Get()
  listarEmprestados() {
    return this.LoansService.listarEmprestados();
  }

  @Get('historico')
  historico() {
    return this.LoansService.historico();
  }

  @Get('vencidos')
  vencidos() {
    return this.LoansService.listarVencidos();
  }

  @Post(':id/saida')
  registrarSaida(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: { solicitante: string; dataSolicitacao: string; dataRetornoEmprestimo?: string },
    @Request() req: any,
  ) {
    return this.LoansService.registrarSaida(id, dados, req.user);
  }

  @Post(':id/retorno')
  registrarRetorno(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.LoansService.registrarRetorno(id, req.user);
  }
}





