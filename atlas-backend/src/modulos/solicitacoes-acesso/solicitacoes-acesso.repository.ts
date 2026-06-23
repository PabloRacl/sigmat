import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccessRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(args: Prisma.SolicitacaoAcessoCreateArgs) {
    return this.prisma.solicitacaoAcesso.create(args);
  }

  async findFirst(args: Prisma.SolicitacaoAcessoFindFirstArgs) {
    return this.prisma.solicitacaoAcesso.findFirst(args);
  }

  async findMany(args: Prisma.SolicitacaoAcessoFindManyArgs) {
    return this.prisma.solicitacaoAcesso.findMany(args);
  }

  async update(args: Prisma.SolicitacaoAcessoUpdateArgs) {
    return this.prisma.solicitacaoAcesso.update(args);
  }
}
