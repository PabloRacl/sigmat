/**
 * [Estado Atual]: Repositório para gerenciar a persistência de transferências e auditorias operacionais.
 * [Dependências Técnicas]:
 *   - PrismaService (Banco de Dados)
 * [Histórico de Modificações]:
 *   - Criado para isolar o acesso direto ao PrismaClient no módulo de Transferências.
 * [Regras de Negócio Imutáveis]:
 *   - Acesso exclusivo ao banco de dados; nenhuma lógica de validação ou permissão deve residir aqui.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique(args: Prisma.TransferenciaFindUniqueArgs) {
    return this.prisma.transferencia.findUnique(args);
  }

  async findMany(args?: Prisma.TransferenciaFindManyArgs) {
    return this.prisma.transferencia.findMany(args);
  }

  async create(args: Prisma.TransferenciaCreateArgs) {
    return this.prisma.transferencia.create(args);
  }

  async update(args: Prisma.TransferenciaUpdateArgs) {
    return this.prisma.transferencia.update(args);
  }

  async delete(args: Prisma.TransferenciaDeleteArgs) {
    return this.prisma.transferencia.delete(args);
  }

  async findEquipamentoUnique<T extends Prisma.EquipamentoFindUniqueArgs>(
    args: T
  ): Promise<Prisma.EquipamentoGetPayload<T> | null> {
    return this.prisma.equipamento.findUnique(args) as any;
  }

  async findSecaoUnique(args: Prisma.SecaoFindUniqueArgs) {
    return this.prisma.secao.findUnique(args);
  }

  get client() {
    return this.prisma;
  }
}
