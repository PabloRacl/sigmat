/**
 * [Estado Atual]: Repositório de dados para a entidade Usuario (e operações acessórias de Seção).
 * [Dependências Técnicas]:
 *   - PrismaService (Banco de Dados)
 * [Histórico de Modificações]:
 *   - Criado para isolar o acesso direto ao PrismaClient, seguindo o padrão Repository.
 * [Regras de Negócio Imutáveis]:
 *   - Acesso exclusivo ao banco de dados; nenhuma regra de negócio deve ser implementada aqui.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args?: Prisma.UsuarioFindManyArgs) {
    return this.prisma.usuario.findMany(args);
  }

  async findUnique(args: Prisma.UsuarioFindUniqueArgs) {
    return this.prisma.usuario.findUnique(args);
  }

  async findFirst(args: Prisma.UsuarioFindFirstArgs) {
    return this.prisma.usuario.findFirst(args);
  }

  async create(args: Prisma.UsuarioCreateArgs) {
    return this.prisma.usuario.create(args);
  }

  async update(args: Prisma.UsuarioUpdateArgs) {
    return this.prisma.usuario.update(args);
  }

  async delete(args: Prisma.UsuarioDeleteArgs) {
    return this.prisma.usuario.delete(args);
  }

  async upsert(args: Prisma.UsuarioUpsertArgs) {
    return this.prisma.usuario.upsert(args);
  }

  async findSecaoFirst(args: Prisma.SecaoFindFirstArgs) {
    return this.prisma.secao.findFirst(args);
  }

  async createSecao(args: Prisma.SecaoCreateArgs) {
    return this.prisma.secao.create(args);
  }

  async findDiretoriaFirst(args: Prisma.DiretoriaFindFirstArgs) {
    return this.prisma.diretoria.findFirst(args);
  }

  async createDiretoria(args: Prisma.DiretoriaCreateArgs) {
    return this.prisma.diretoria.create(args);
  }

  async findBatalhaoFirst(args: Prisma.BatalhaoFindFirstArgs) {
    return this.prisma.batalhao.findFirst(args);
  }

  async createBatalhao(args: Prisma.BatalhaoCreateArgs) {
    return this.prisma.batalhao.create(args);
  }
}
