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
  Controller, Get, Post, Patch, Delete,
  Param, Body, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { UsersService } from './usuarios.service';
import { JwtAuthGuard } from '../autenticacao/guardas/jwt-autenticacao.guard';
import { RolesGuard } from '../../comum/guardas/roles.guard';
import { Roles } from '../../comum/decoradores/roles.decorator';
import { LoggedUser } from '../../comum/decoradores/logged-user.decorator';
import { PerfilUsuario } from '@prisma/client';

class CriarUsuarioDto {
  login: string = '';
  matricula: string = '';
  nome: string = '';
  email?: string;
  postoGraduacao?: string;
  perfil: PerfilUsuario = PerfilUsuario.USUARIO_BATALHAO;
  secaoId?: number;
  batalhaoId?: number;
}

class AtualizarUsuarioDto {
  login?: string;
  matricula?: string;
  nome?: string;
  email?: string;
  postoGraduacao?: string;
  perfil?: PerfilUsuario;
  secaoId?: number;
  batalhaoId?: number;
}

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_DTEC')
export class UsersController {
  constructor(private readonly UsersService: UsersService) {}

  @Get()
  async listarTodos(@LoggedUser() usuario: any) {
    return this.UsersService.listarTodos(usuario);
  }

  @Get('login/:login')
  async buscarPorLogin(@Param('login') login: string, @LoggedUser() usuario: any) {
    return this.UsersService.buscarPorLoginAutorizado(login, usuario);
  }

  @Get(':id')
  async buscarPorId(
    @Param('id', ParseIntPipe) id: number,
    @LoggedUser() usuario: any,
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





