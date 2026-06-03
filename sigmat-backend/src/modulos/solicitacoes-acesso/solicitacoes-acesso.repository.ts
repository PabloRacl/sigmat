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
}
