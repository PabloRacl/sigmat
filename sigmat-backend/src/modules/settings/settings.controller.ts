import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CriarTipoDto {
  nome: string;
}

class CriarMarcaDto {
  nome: string;
}

class CriarModeloDto {
  nome: string;
  marcaId?: number;
}

@Controller('configuracoes')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly SettingsService: SettingsService) {}

  @Get('tipos')
  listarTipos() {
    return this.SettingsService.listarTipos();
  }

  @Get('marcas')
  listarMarcas() {
    return this.SettingsService.listarMarcas();
  }

  @Get('modelos')
  listarModelos(@Query('marcaId') marcaId?: string) {
    return this.SettingsService.listarModelos(marcaId ? +marcaId : undefined);
  }

  @Post('tipos')
  criarTipo(@Body() dados: CriarTipoDto) {
    return this.SettingsService.criarTipo(dados);
  }

  @Post('marcas')
  criarMarca(@Body() dados: CriarMarcaDto) {
    return this.SettingsService.criarMarca(dados);
  }

  @Post('modelos')
  criarModelo(@Body() dados: CriarModeloDto) {
    return this.SettingsService.criarModelo(dados);
  }

  @Get('status')
  listarStatus() {
    return this.SettingsService.listarStatus();
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
  listarSecoes() {
    return this.SettingsService.listarSecoes();
  }

  @Get('batalhoes')
  listarBatalhoes() {
    return this.SettingsService.listarBatalhoes();
  }
}





