import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerfilUsuario } from '@prisma/client';

class CriarUsuarioDto {
  login: string;
  matricula: string;
  nome: string;
  email?: string;
  postoGraduacao?: string;
  perfil: PerfilUsuario;
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
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly UsersService: UsersService) {}

  @Get()
  async listarTodos() {
    return this.UsersService.listarTodos();
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.UsersService.buscarPorId(id);
  }

  @Get('login/:login')
  async buscarPorLogin(@Param('login') login: string) {
    return this.UsersService.buscarPorLogin(login);
  }

  @Post()
  async criar(@Body() dados: CriarUsuarioDto) {
    return this.UsersService.criar(dados);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: AtualizarUsuarioDto,
  ) {
    return this.UsersService.atualizar(id, dados);
  }

  @Delete(':id')
  async remover(@Param('id', ParseIntPipe) id: number) {
    return this.UsersService.remover(id);
  }
}





