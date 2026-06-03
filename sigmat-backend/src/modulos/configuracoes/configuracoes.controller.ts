import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from './configuracoes.service';
import { JwtAuthGuard } from '../autenticacao/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CriarTipoDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do tipo de equipamento não pode ser vazio.' })
  nome: string = '';
}

class CriarMarcaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da marca não pode ser vazio.' })
  nome: string = '';
}

class CriarModeloDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do modelo não pode ser vazio.' })
  nome: string = '';

  @IsInt()
  @IsOptional()
  marcaId?: number;
}

class CriarSecaoDto {
  @IsString()
  @IsNotEmpty()
  sigla: string = '';

  @IsString()
  @IsNotEmpty()
  nome: string = '';

  @IsInt()
  @IsOptional()
  batalhaoId?: number;

  @IsInt()
  @IsOptional()
  diretoriaId?: number;
}

class AtualizarSecaoDto {
  @IsString()
  @IsOptional()
  sigla?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsInt()
  @IsOptional()
  batalhaoId?: number;

  @IsInt()
  @IsOptional()
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

  @Delete('tipos/:id')
  @Roles('ADMIN_DTEC')
  excluirTipo(@Param('id') id: string) {
    return this.SettingsService.excluirTipo(Number(id));
  }

  @Delete('marcas/:id')
  @Roles('ADMIN_DTEC')
  excluirMarca(@Param('id') id: string) {
    return this.SettingsService.excluirMarca(Number(id));
  }

  @Delete('modelos/:id')
  @Roles('ADMIN_DTEC')
  excluirModelo(@Param('id') id: string) {
    return this.SettingsService.excluirModelo(Number(id));
  }
}





