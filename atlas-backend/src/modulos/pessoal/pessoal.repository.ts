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
import { PrismaService } from '../../banco-dados/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany<T extends Prisma.UsuarioFindManyArgs>(args?: Prisma.SelectSubset<T, Prisma.UsuarioFindManyArgs>): Promise<Prisma.UsuarioGetPayload<T>[]> {
    return this.prisma.usuario.findMany(args);
  }

  async findUnique<T extends Prisma.UsuarioFindUniqueArgs>(args: Prisma.SelectSubset<T, Prisma.UsuarioFindUniqueArgs>): Promise<Prisma.UsuarioGetPayload<T> | null> {
    return this.prisma.usuario.findUnique(args);
  }

  async findFirst<T extends Prisma.UsuarioFindFirstArgs>(args: Prisma.SelectSubset<T, Prisma.UsuarioFindFirstArgs>): Promise<Prisma.UsuarioGetPayload<T> | null> {
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

  async deleteCascade(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Remove apenas acessos e tokens (para impedir login futuro)
      await tx.refreshToken.deleteMany({ where: { usuarioId: id } });
      await tx.usuarioSecao.deleteMany({ where: { usuarioId: id } });
      await tx.usuarioTipoEquipamento.deleteMany({ where: { usuarioId: id } });

      // 2. Remove a responsabilidade de equipamentos atuais
      await tx.equipamento.updateMany({
        where: { usuarioResponsavelId: id },
        data: { usuarioResponsavelId: null },
      });

      // 3. Em vez de deletar fisicamente, marcamos como "Removido" (Soft Delete).
      // Isso mantém todos os logs, alterações pendentes e ordens de serviço intactos,
      // mas libera o CPF/Login para caso a pessoa precise ser recadastrada no futuro.
      const user = await tx.usuario.findUnique({ where: { id } });
      if (!user) throw new Error('Usuário não encontrado');

      return tx.usuario.update({
        where: { id },
        data: {
          login: `removido_${id}_${user.login}`,
          nome: `[REMOVIDO] ${user.nome}`,
          autorizado: false,
        },
      });
    });
  }

  async upsert<T extends Prisma.UsuarioUpsertArgs>(args: Prisma.SelectSubset<T, Prisma.UsuarioUpsertArgs>): Promise<Prisma.UsuarioGetPayload<T>> {
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
