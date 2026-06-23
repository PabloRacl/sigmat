/**
 * [Estado Atual]: Controlador REST principal para CRUD e buscas avançadas de Equipamentos.
 * [Dependências Técnicas]: Consome EquipmentService; Protegido por JwtAuthGuard.
 * [Histórico de Modificações]: Padronização de Clean Code; Validação por DTOs.
 * [Regras de Negócio Imutáveis]: Não importar PrismaClient.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EquipmentService } from './materiais.service';
import { CriarEquipamentoDto } from './dto/criar-equipamento.dto';
import { AtualizarEquipamentoDto } from './dto/atualizar-equipamento.dto';
import { AtualizarMassaDto } from './dto/atualizar-massa.dto';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';

@ApiTags('Equipamentos / Materiais')
@ApiBearerAuth()
@Controller('equipamentos')
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiOperation({ summary: 'Listar equipamentos com filtros avançados' })
  async listarTodos(
    @LoggedUser() usuario: UsuarioLogado,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tipoId') tipoId?: number,
    @Query('statusId') statusId?: number,
    @Query('disponibilidadeId') disponibilidadeId?: number,
    @Query('secaoId') secaoId?: number,
    @Query('marcaId') marcaId?: number,
    @Query('patrimonio') patrimonio?: string,
    @Query('sei') sei?: string,
    @Query('numeroSerie') numeroSerie?: string,
    @Query('dataAquisicao') dataAquisicao?: string,
    @Query('observacao') observacao?: string,
  ) {
    return this.equipmentService.listarTodos(usuario, {
      page,
      limit,
      search,
      tipoId,
      statusId,
      disponibilidadeId,
      secaoId,
      marcaId,
      patrimonio,
      sei,
      numeroSerie,
      dataAquisicao,
      observacao,
    });
  }

  @Patch('massa')
  @ApiOperation({ summary: 'Atualizar informações de vários equipamentos em lote' })
  async atualizarEmMassa(
    @Body() body: AtualizarMassaDto,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.equipmentService.atualizarEmMassa(
      body.ids,
      body.dados,
      usuario,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes completos de um equipamento' })
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.buscarPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo equipamento' })
  async criar(@Body() dados: CriarEquipamentoDto, @LoggedUser() usuario: UsuarioLogado) {
    return this.equipmentService.criar(dados, usuario);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar equipamento existente' })
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarEquipamentoDto,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.equipmentService.atualizar(id, dados, usuario);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um equipamento do sistema' })
  async remover(
    @Param('id', ParseIntPipe) id: number,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.equipmentService.remover(id, usuario);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Consultar histórico de operações e auditoria do equipamento' })
  async obterHistorico(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.obterHistorico(id);
  }
}
