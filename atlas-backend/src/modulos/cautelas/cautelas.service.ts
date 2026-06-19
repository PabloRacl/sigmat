import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { AcaoLog } from '@prisma/client';
import { AuditService } from '../../compartilhado/servicos/audit.service';

const INCLUDE_EMPRESTIMO = {
  tipoEquipamento: true,
  marca: true,
  secao: { include: { batalhao: true } },
  status: true,
  disponibilidade: true,
};

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /** Lista todos os equipamentos atualmente emprestados */
  async listarEmprestados() {
    const dispEmprestado = await this.prisma.disponibilidade.findFirst({
      where: { nome: { equals: 'EMPRESTIMO', mode: 'insensitive' } },
    });
    if (!dispEmprestado) return [];

    return this.prisma.equipamento.findMany({
      where: { disponibilidadeId: dispEmprestado.id },
      include: INCLUDE_EMPRESTIMO,
      orderBy: { dataSolicitacao: 'desc' },
    });
  }

  /** Histórico de todos os empréstimos (retornados e ativos) */
  async historico() {
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

  /** Registrar saída — marca equipamento como Emprestado */
  async registrarSaida(
    equipamentoId: number,
    dados: {
      solicitante: string;
      usuarioResponsavelId?: number;
      dataSolicitacao: string;
      dataRetornoEmprestimo?: string;
    },
    usuario: any,
  ) {
    const equip = await this.prisma.equipamento.findUnique({
      where: { id: equipamentoId },
    });
    if (!equip) throw new NotFoundException('Equipamento não encontrado');

    const dispEmprestado = await this.prisma.disponibilidade.findFirst({
      where: { nome: { equals: 'EMPRESTIMO', mode: 'insensitive' } },
    });
    if (!dispEmprestado)
      throw new NotFoundException(
        'Disponibilidade "EMPRESTIMO" não cadastrada',
      );

    const resultado = await this.prisma.equipamento.update({
      where: { id: equipamentoId },
      data: {
        disponibilidadeId: dispEmprestado.id,
        solicitante: dados.solicitante,
        usuarioResponsavelId: dados.usuarioResponsavelId || null,
        dataSolicitacao: new Date(dados.dataSolicitacao),
        dataRetornoEmprestimo: dados.dataRetornoEmprestimo
          ? new Date(dados.dataRetornoEmprestimo)
          : null,
      },
      include: INCLUDE_EMPRESTIMO,
    });

    await this.auditService.registrarLog({
      usuarioId: usuario.id,
      equipamentoId: equipamentoId,
      acao: AcaoLog.UPDATE,
      descricao: `Saída registrada: Equipamento ${resultado.patrimonio} entregue a ${dados.solicitante}.`,
      dadosAlterados: dados,
    });

    return resultado;
  }

  /** Registrar retorno — marca equipamento como Disponível e limpa os dados de empréstimo */
  async registrarRetorno(equipamentoId: number, usuario: any) {
    const equip = await this.prisma.equipamento.findUnique({
      where: { id: equipamentoId },
    });
    if (!equip) throw new NotFoundException('Equipamento não encontrado');

    const dispDisponivel = await this.prisma.disponibilidade.findFirst({
      where: { nome: { equals: 'DISPONÍVEL', mode: 'insensitive' } },
    });
    if (!dispDisponivel)
      throw new NotFoundException(
        'Disponibilidade "DISPONÍVEL" não cadastrada',
      );

    const resultado = await this.prisma.equipamento.update({
      where: { id: equipamentoId },
      data: {
        disponibilidadeId: dispDisponivel.id,
        solicitante: null,
        usuarioResponsavelId: null,
        dataSolicitacao: null,
        dataRetornoEmprestimo: null,
      },
      include: INCLUDE_EMPRESTIMO,
    });

    await this.auditService.registrarLog({
      usuarioId: usuario.id,
      equipamentoId: equipamentoId,
      acao: AcaoLog.UPDATE,
      descricao: `Retorno registrado: Equipamento ${resultado.patrimonio} devolvido ao estoque.`,
      dadosAlterados: {
        statusAnterior: 'EMPRESTIMO',
        statusAtual: 'DISPONÍVEL',
      },
    });

    return resultado;
  }

  /** Equipamentos com retorno vencido (data de retorno no passado e ainda emprestados) */
  async listarVencidos() {
    const dispEmprestado = await this.prisma.disponibilidade.findFirst({
      where: { nome: { equals: 'EMPRESTIMO', mode: 'insensitive' } },
    });
    if (!dispEmprestado) return [];

    return this.prisma.equipamento.findMany({
      where: {
        disponibilidadeId: dispEmprestado.id,
        dataRetornoEmprestimo: { lt: new Date() },
      },
      include: INCLUDE_EMPRESTIMO,
      orderBy: { dataRetornoEmprestimo: 'asc' },
    });
  }
}
