/**
 * [Estado Atual]: Repositório dedicado a gerenciar dados de Equipamentos.
 * [Dependências Técnicas]: Consome PrismaService.
 * [Histórico de Modificações]: Extração de lógica de banco de dados do EquipmentService.
 * [Regras de Negócio Imutáveis]: Retornar entidades limpas; Encapsular todas as chamadas complexas do Prisma (filtros, paginação).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EquipmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUsuarioCompleto(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });
  }

  async countEquipamentos(whereClause: Prisma.EquipamentoWhereInput) {
    return this.prisma.equipamento.count({ where: whereClause });
  }

  async findEquipamentos(
    whereClause: Prisma.EquipamentoWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.equipamento.findMany({
      where: whereClause,
      include: {
        tipoEquipamento: true,
        status: true,
        secao: { include: { batalhao: true, diretoria: true } },
        marca: true,
        modelo: true,
        tipoAquisicao: true,
        disponibilidade: true,
      },
      orderBy: { patrimonio: 'asc' },
      skip,
      take,
    });
  }

  async findEquipamentoById(id: number) {
    return this.prisma.equipamento.findUnique({
      where: { id },
      include: {
        tipoEquipamento: true,
        status: true,
        secao: { include: { batalhao: true, diretoria: true } },
        marca: true,
        modelo: true,
        tipoAquisicao: true,
        disponibilidade: true,
      },
    });
  }

  async findSecaoById(id: number) {
    return this.prisma.secao.findUnique({
      where: { id },
      include: { batalhao: true, diretoria: true },
    });
  }

  async findStatusEquipamentoByNome(nome: string) {
    return this.prisma.statusEquipamento.findFirst({
      where: {
        nome: {
          in: [
            nome,
            nome.toUpperCase(),
            nome.toLowerCase(),
            'Em ' + nome,
            'EM ' + nome.toUpperCase(),
            'Em Manutenção',
            'EM MANUTENÇÃO',
            'MANUTENÇÃO',
            'MANUTENCAO',
          ],
        },
      },
    });
  }

  async createEquipamento(dados: Prisma.EquipamentoUncheckedCreateInput) {
    return this.prisma.equipamento.create({
      data: dados,
    });
  }

  async updateEquipamento(id: number, dados: Prisma.EquipamentoUncheckedUpdateInput) {
    return this.prisma.equipamento.update({
      where: { id },
      data: dados,
    });
  }

  async deleteEquipamento(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // Desvincula os logs de auditoria do equipamento para preservar o histórico sem bloquear a exclusão
      await tx.logOperacao.updateMany({
        where: { equipamentoId: id },
        data: { equipamentoId: null },
      });

      // Remove as solicitações de alteração pendentes atreladas ao equipamento
      await tx.alteracaoPendente.deleteMany({
        where: { equipamentoId: id },
      });

      // Tenta deletar o equipamento. Se houver Ordens de Serviço ou Transferências, 
      // o Prisma lançará o erro P2003 normalmente (proteção de integridade do acervo).
      return tx.equipamento.delete({
        where: { id },
      });
    });
  }

  async findLogsByEquipamento(id: number) {
    return this.prisma.logOperacao.findMany({
      where: { equipamentoId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: {
          select: { nome: true, matricula: true, postoGraduacao: true },
        },
      },
    });
  }

  async findEquipamentosByIds(ids: number[]) {
    return this.prisma.equipamento.findMany({
      where: { id: { in: ids } },
      include: { secao: true },
    });
  }

  async updateManyEquipamentosTransaction(
    equipamentos: { id: number }[],
    updateData: Prisma.EquipamentoUncheckedUpdateInput,
  ) {
    return this.prisma.$transaction(
      equipamentos.map((eq) => {
        return this.prisma.equipamento.update({
          where: { id: eq.id },
          data: updateData,
        });
      }),
    );
  }
}
