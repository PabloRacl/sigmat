import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './configuracoes.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';
import { CriarTipoDto } from './dto/criar-tipo.dto';
import { CriarMarcaDto } from './dto/criar-marca.dto';
import { CriarModeloDto } from './dto/criar-modelo.dto';
import { CriarSecaoDto } from './dto/criar-secao.dto';
import { AtualizarSecaoDto } from './dto/atualizar-secao.dto';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';

@ApiTags('Configurações (Tabelas Básicas)')
@ApiBearerAuth()
@Controller('configuracoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly SettingsService: SettingsService) {}

  @Get('tipos')
  @ApiOperation({ summary: 'Listar tipos de equipamento' })
  listarTipos() {
    return this.SettingsService.listarTipos();
  }

  @Get('marcas')
  @ApiOperation({ summary: 'Listar marcas' })
  listarMarcas() {
    return this.SettingsService.listarMarcas();
  }

  @Get('modelos')
  @ApiOperation({ summary: 'Listar modelos (com filtro opcional por marca)' })
  listarModelos(@Query('marcaId') marcaId?: string) {
    return this.SettingsService.listarModelos(marcaId ? +marcaId : undefined);
  }

  @Post('tipos')
  @ApiOperation({ summary: 'Criar novo tipo de equipamento' })
  criarTipo(@Body() dados: CriarTipoDto) {
    return this.SettingsService.criarTipo(dados);
  }

  @Post('marcas')
  @ApiOperation({ summary: 'Criar nova marca' })
  criarMarca(@Body() dados: CriarMarcaDto) {
    return this.SettingsService.criarMarca(dados);
  }

  @Post('modelos')
  @ApiOperation({ summary: 'Criar novo modelo' })
  criarModelo(@Body() dados: CriarModeloDto) {
    return this.SettingsService.criarModelo(dados);
  }

  @Get('status')
  listarStatus() {
    return this.SettingsService.listarStatus();
  }

  @Post('status')
  @Roles('ADMIN_DTEC')
  criarStatus(@Body() dados: { nome: string }) {
    return this.SettingsService.criarStatus(dados);
  }

  @Get('disponibilidades')
  listarDisponibilidades() {
    return this.SettingsService.listarDisponibilidades();
  }

  @Get('tipos-aquisicao')
  listarTiposAquisicao() {
    return this.SettingsService.listarTiposAquisicao();
  }

  @Get('secoes')
  listarSecoes(@LoggedUser() usuario: UsuarioLogado) {
    return this.SettingsService.listarSecoes(usuario);
  }

  @Post('secoes')
  @Roles('ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE')
  criarSecao(@Body() dados: CriarSecaoDto, @LoggedUser() usuario: UsuarioLogado) {
    return this.SettingsService.criarSecao(dados, usuario);
  }

  @Put('secoes/:id')
  @Roles('ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE')
  atualizarSecao(
    @Param('id') id: string,
    @Body() dados: AtualizarSecaoDto,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.SettingsService.atualizarSecao(Number(id), dados, usuario);
  }

  @Get('batalhoes')
  listarBatalhoes() {
    return this.SettingsService.listarBatalhoes();
  }

  @Get('diretorias')
  listarDiretorias() {
    return this.SettingsService.listarDiretorias();
  }

  @Delete('tipos/:id')
  @Roles('ADMIN_DTEC')
  excluirTipo(@Param('id') id: string) {
    return this.SettingsService.excluirTipo(Number(id));
  }

  @Put('tipos/:id')
  @Roles('ADMIN_DTEC')
  atualizarTipo(@Param('id') id: string, @Body() dados: { nome: string }) {
    return this.SettingsService.atualizarTipo(Number(id), dados);
  }

  @Delete('marcas/:id')
  @Roles('ADMIN_DTEC')
  excluirMarca(@Param('id') id: string) {
    return this.SettingsService.excluirMarca(Number(id));
  }

  @Put('marcas/:id')
  @Roles('ADMIN_DTEC')
  atualizarMarca(@Param('id') id: string, @Body() dados: { nome: string }) {
    return this.SettingsService.atualizarMarca(Number(id), dados);
  }

  @Delete('modelos/:id')
  @Roles('ADMIN_DTEC')
  excluirModelo(@Param('id') id: string) {
    return this.SettingsService.excluirModelo(Number(id));
  }

  @Put('modelos/:id')
  @Roles('ADMIN_DTEC')
  atualizarModelo(@Param('id') id: string, @Body() dados: { nome: string; marcaId?: number }) {
    return this.SettingsService.atualizarModelo(Number(id), dados);
  }

  @Post('disponibilidades')
  @Roles('ADMIN_DTEC')
  criarDisponibilidade(@Body() dados: { nome: string }) {
    return this.SettingsService.criarDisponibilidade(dados);
  }

  @Put('disponibilidades/:id')
  @Roles('ADMIN_DTEC')
  atualizarDisponibilidade(@Param('id') id: string, @Body() dados: { nome: string }) {
    return this.SettingsService.atualizarDisponibilidade(Number(id), dados);
  }

  @Delete('disponibilidades/:id')
  @Roles('ADMIN_DTEC')
  excluirDisponibilidade(@Param('id') id: string) {
    return this.SettingsService.excluirDisponibilidade(Number(id));
  }

  @Put('status/:id')
  @Roles('ADMIN_DTEC')
  atualizarStatus(@Param('id') id: string, @Body() dados: { nome: string }) {
    return this.SettingsService.atualizarStatus(Number(id), dados);
  }

  @Delete('status/:id')
  @Roles('ADMIN_DTEC')
  excluirStatus(@Param('id') id: string) {
    return this.SettingsService.excluirStatus(Number(id));
  }
}
