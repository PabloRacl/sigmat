/**
 * [Estado Atual]: Controlador REST para gerenciamento de Ordens de Serviço (Manutenção).
 * [Dependências Técnicas]: Consome MaintenanceService; Interage via JWT Auth.
 * [Histórico de Modificações]: Refatoração para Clean Code - Isolamento do banco de dados concluído.
 * [Regras de Negócio Imutáveis]: Não importar PrismaClient; Validar DTOs rigorosamente.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './assistencia-tecnica.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';

import {
  CriarOrdemServicoDto,
  AtualizarStatusOsDto,
} from './dto/assistencia-tecnica.dto';

@ApiTags('Manutenção / Assistência Técnica')
@ApiBearerAuth()
@Controller('manutencao')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly MaintenanceService: MaintenanceService) {}

  @Get('contagem')
  @ApiOperation({ summary: 'Contar ordens de serviço pendentes/abertas' })
  contarPendentes(@LoggedUser() usuario: any) {
    return this.MaintenanceService.contarPendentes(usuario).then((total) => ({
      total,
    }));
  }

  @Get('pendentes/contagem')
  @ApiOperation({ summary: 'Contar ordens de serviço (rota legada)' })
  contarPendentesLegacy(@LoggedUser() usuario: any) {
    return this.contarPendentes(usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as ordens de serviço' })
  listarTodos(@LoggedUser() usuario: any) {
    return this.MaintenanceService.listarTodos(usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de uma OS específica' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.MaintenanceService.buscarPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova Ordem de Serviço' })
  criar(@Body() dados: CriarOrdemServicoDto, @LoggedUser() usuario: any) {
    return this.MaintenanceService.criar(dados, usuario);
  }

  @Post('massa')
  @ApiOperation({ summary: 'Criar múltiplas OS em lote' })
  criarMassa(@Body() dados: any, @LoggedUser() usuario: any) {
    return this.MaintenanceService.criarMassa(dados, usuario);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status e andamento de uma OS' })
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarStatusOsDto,
    @LoggedUser() usuario: any,
  ) {
    return this.MaintenanceService.atualizarStatus(
      id,
      dados.status,
      dados,
      usuario,
    );
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Obter histórico de tramitações de uma OS' })
  obterHistorico(@Param('id', ParseIntPipe) id: number) {
    return this.MaintenanceService.obterHistorico(id);
  }
}
