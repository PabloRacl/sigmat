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
import { UsersService } from './pessoal.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly UsersService: UsersService) {}

  @Get()
  async listarTodos(@LoggedUser() usuario: UsuarioLogado) {
    return this.UsersService.listarTodos(usuario);
  }

  @Get('login/:login')
  async buscarPorLogin(
    @Param('login') login: string,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.UsersService.buscarPorLoginAutorizado(login, usuario);
  }

  @Get(':id')
  async buscarPorId(
    @Param('id', ParseIntPipe) id: number,
    @LoggedUser() usuario: UsuarioLogado,
  ) {
    return this.UsersService.buscarPorIdAutorizado(id, usuario);
  }

  @Post()
  @Roles('ADMIN_DTEC')
  async criar(@Body() dados: CriarUsuarioDto) {
    return this.UsersService.criar(dados);
  }

  @Patch(':id')
  @Roles('ADMIN_DTEC')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarUsuarioDto,
  ) {
    return this.UsersService.atualizar(id, dados);
  }

  @Delete(':id')
  @Roles('ADMIN_DTEC')
  async remover(@Param('id', ParseIntPipe) id: number) {
    return this.UsersService.remover(id);
  }
}
