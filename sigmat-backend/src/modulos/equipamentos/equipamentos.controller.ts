/**
 * [Estado Atual]: Controlador REST principal para CRUD e buscas avançadas de Equipamentos.
 * [Dependências Técnicas]: Consome EquipmentService; Protegido por JwtAuthGuard.
 * [Histórico de Modificações]: Padronização de Clean Code; Validação por DTOs.
 * [Regras de Negócio Imutáveis]: Não importar PrismaClient.
 */
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { EquipmentService } from './equipamentos.service';
import { CriarEquipamentoDto } from './dto/criar-equipamento.dto';
import { AtualizarEquipamentoDto } from './dto/atualizar-equipamento.dto';
import { AtualizarMassaDto } from './dto/atualizar-massa.dto';
import { JwtAuthGuard } from '../autenticacao/guardas/jwt-autenticacao.guard';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';


@Controller('equipamentos')
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async listarTodos(
    @LoggedUser() usuario: any,
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
      page, limit, search, tipoId, statusId, disponibilidadeId, secaoId, 
      marcaId, patrimonio, sei, numeroSerie, dataAquisicao, observacao
    });
  }

  @Patch('massa')
  async atualizarEmMassa(
    @Body() body: AtualizarMassaDto,
    @LoggedUser() usuario: any
  ) {
    return this.equipmentService.atualizarEmMassa(body.ids, body.dados, usuario);
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.buscarPorId(id);
  }

  @Post()
  async criar(@Body() dados: CriarEquipamentoDto, @LoggedUser() usuario: any) {
    return this.equipmentService.criar(dados, usuario);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dados: AtualizarEquipamentoDto,
    @LoggedUser() usuario: any
  ) {
    return this.equipmentService.atualizar(id, dados, usuario);
  }

  @Delete(':id')
  async remover(@Param('id', ParseIntPipe) id: number, @LoggedUser() usuario: any) {
    return this.equipmentService.remover(id, usuario);
  }

  @Get(':id/historico')
  async obterHistorico(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentService.obterHistorico(id);
  }
}





