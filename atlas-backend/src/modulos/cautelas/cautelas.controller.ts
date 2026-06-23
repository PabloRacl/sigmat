import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoansService } from './cautelas.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';

@ApiTags('Empréstimos / Cautelas')
@ApiBearerAuth()
@Controller('emprestimos')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly LoansService: LoansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os empréstimos ativos' })
  listarEmprestados() {
    return this.LoansService.listarEmprestados();
  }

  @Get('historico')
  @ApiOperation({ summary: 'Ver histórico completo de cautelas' })
  historico() {
    return this.LoansService.historico();
  }

  @Get('vencidos')
  @ApiOperation({ summary: 'Listar cautelas com prazo vencido' })
  vencidos() {
    return this.LoansService.listarVencidos();
  }

  @Post(':id/saida')
  @ApiOperation({ summary: 'Registrar saída/empréstimo de um equipamento' })
  registrarSaida(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dados: {
      solicitante: string;
      usuarioResponsavelId?: number;
      dataSolicitacao: string;
      dataRetornoEmprestimo?: string;
    },
    @Request() req: any,
  ) {
    return this.LoansService.registrarSaida(id, dados, req.user);
  }

  @Post(':id/retorno')
  @ApiOperation({ summary: 'Registrar devolução/retorno de um equipamento' })
  registrarRetorno(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.LoansService.registrarRetorno(id, req.user);
  }
}
