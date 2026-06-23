import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../banco-dados/prisma.service';
import { ILoansRepository } from './cautelas.repository.interface';

const INCLUDE_EMPRESTIMO = {
  tipoEquipamento: true,
  marca: true,
  secao: { include: { batalhao: true } },
  status: true,
  disponibilidade: true,
};

@Injectable()
export class LoansRepository implements ILoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarEmprestados(): Promise<any[]> {
    const dispEmprestado = await this.obterDisponibilidadeId('EMPRESTIMO');
    if (!dispEmprestado) return [];

    return this.prisma.equipamento.findMany({
      where: { disponibilidadeId: dispEmprestado },
      include: INCLUDE_EMPRESTIMO,
      orderBy: { dataSolicitacao: 'desc' },
    });
  }

  async historico(): Promise<any[]> {
    return this.prisma.equipamento.findMany({
      where: {
        OR: [
          { solicitante: { not: null } },
          { dataSolicitacao: { not: null } },
        ],
      },
      include: INCLUDE_EMPRESTIMO,
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async buscarPorId(id: number): Promise<any> {
    return this.prisma.equipamento.findUnique({
      where: { id },
    });
  }

  async obterDisponibilidadeId(nome: string): Promise<number | null> {
    const disp = await this.prisma.disponibilidade.findFirst({
      where: {
        nome: {
          in: [
            nome,
            nome.toUpperCase(),
            nome.toLowerCase(),
            'EMPRÉSTIMO',
            'Empréstimo',
          ],
        },
      },
    });
    return disp ? disp.id : null;
  }

  async atualizar(id: number, data: any): Promise<any> {
    return this.prisma.equipamento.update({
      where: { id },
      data,
      include: INCLUDE_EMPRESTIMO,
    });
  }

  async listarVencidos(): Promise<any[]> {
    const dispEmprestado = await this.obterDisponibilidadeId('EMPRESTIMO');
    if (!dispEmprestado) return [];

    return this.prisma.equipamento.findMany({
      where: {
        disponibilidadeId: dispEmprestado,
        dataRetornoEmprestimo: { lt: new Date() },
      },
      include: INCLUDE_EMPRESTIMO,
      orderBy: { dataRetornoEmprestimo: 'asc' },
    });
  }
}
