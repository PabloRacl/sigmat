/**
 * [Estado Atual]: Controlador REST para gerenciamento de Usuários.
 * [Dependências Técnicas]:
 *   - UsersService
 * [Histórico de Modificações]:
 *   - Adicionado cabeçalho de contexto arquitetural de alta eficiência de tokens.
 * [Regras de Negócio Imutáveis]:
 *   - Rotas protegidas por JwtAuthGuard.
 *   - Delegação estrita de processamento para o UsersService.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './pessoal.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';

@ApiTags('Pessoal (Usuários)')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly UsersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários cadastrados' })
  async listarTodos(@LoggedUser() usuario: UsuarioLogado) {
    return this.UsersService.listarTodos(usuario);
  }

  @Get('login/:login')
  @ApiOperation({ summary: 'Buscar usuário pelo CPF ou Login' })
  async buscarPorLogin(
    @Param('login') login: string,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.UsersService.buscarPorLoginAutorizado(login, usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um usuário por ID' })
  async buscarPorId(
    @Param('id', ParseIntPipe) id: number,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.UsersService.buscarPorIdAutorizado(id, usuario);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @Roles('ADMIN_DTEC')
  async criar(@Body() dados: CriarUsuarioDto) {
    return this.UsersService.criar(dados);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de um usuário' })
  @Roles('ADMIN_DTEC')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarUsuarioDto,
  ) {
    return this.UsersService.atualizar(id, dados);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um usuário' })
  @Roles('ADMIN_DTEC')
  async remover(@Param('id', ParseIntPipe) id: number) {
    return this.UsersService.remover(id);
  }
}
