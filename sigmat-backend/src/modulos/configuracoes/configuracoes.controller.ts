import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from './configuracoes.service';
import { JwtAuthGuard } from '../autenticacao/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';

class CriarTipoDto {
  nome: string = '';
}

class CriarMarcaDto {
  nome: string = '';
}

class CriarModeloDto {
  nome: string = '';
  marcaId?: number;
}

class CriarSecaoDto {
  sigla: string = '';
  nome: string = '';
  batalhaoId?: number;
  diretoriaId?: number;
}

class AtualizarSecaoDto {
  sigla?: string;
  nome?: string;
  batalhaoId?: number;
  diretoriaId?: number;
}

@Controller('configuracoes')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  listarSecoes(@Req() req: any) {
    return this.SettingsService.listarSecoes(req.user);
  }

  @Post('secoes')
  @Roles('ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE')
  criarSecao(@Body() dados: CriarSecaoDto, @Req() req: any) {
    return this.SettingsService.criarSecao(dados, req.user);
  }

  @Put('secoes/:id')
  @Roles('ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE')
  atualizarSecao(@Param('id') id: string, @Body() dados: AtualizarSecaoDto, @Req() req: any) {
    return this.SettingsService.atualizarSecao(Number(id), dados, req.user);
  }

  @Get('batalhoes')
  listarBatalhoes() {
    return this.SettingsService.listarBatalhoes();
  }
}





