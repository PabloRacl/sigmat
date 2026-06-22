import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { AcaoLog } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { AuditService } from '../../compartilhado/servicos/audit.service';

const INCLUDE_EMPRESTIMO = {
  tipoEquipamento: true,
  marca: true,
  secao: { include: { batalhao: true } },
  status: true,
  disponibilidade: true,
};

import { I_LOANS_REPOSITORY } from './repositorios/cautelas.repository.interface';
import type { ILoansRepository } from './repositorios/cautelas.repository.interface';

@Injectable()
export class LoansService {
  constructor(
    @Inject(I_LOANS_REPOSITORY)
    private readonly repository: ILoansRepository,
    private readonly auditService: AuditService,
  ) {}

  /** Lista todos os equipamentos atualmente emprestados */
  async listarEmprestados() {
    return this.repository.listarEmprestados();
  }

  /** Histórico de todos os empréstimos (retornados e ativos) */
  async historico() {
    return this.repository.historico();
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
    const equip = await this.repository.buscarPorId(equipamentoId);
    if (!equip) throw new NotFoundException('Equipamento não encontrado');

    const dispEmprestado = await this.repository.obterDisponibilidadeId('EMPRESTIMO');
    if (!dispEmprestado)
      throw new NotFoundException(
        'Disponibilidade "EMPRESTIMO" não cadastrada',
      );

    const resultado = await this.repository.atualizar(equipamentoId, {
      disponibilidadeId: dispEmprestado,
      solicitante: dados.solicitante,
      usuarioResponsavelId: dados.usuarioResponsavelId || null,
      dataSolicitacao: new Date(dados.dataSolicitacao),
      dataRetornoEmprestimo: dados.dataRetornoEmprestimo
        ? new Date(dados.dataRetornoEmprestimo)
        : null,
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
    const equip = await this.repository.buscarPorId(equipamentoId);
    if (!equip) throw new NotFoundException('Equipamento não encontrado');

    const dispDisponivel = await this.repository.obterDisponibilidadeId('DISPONÍVEL');
    if (!dispDisponivel)
      throw new NotFoundException(
        'Disponibilidade "DISPONÍVEL" não cadastrada',
      );

    const resultado = await this.repository.atualizar(equipamentoId, {
      disponibilidadeId: dispDisponivel,
      solicitante: null,
      usuarioResponsavelId: null,
      dataSolicitacao: null,
      dataRetornoEmprestimo: null,
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
    return this.repository.listarVencidos();
  }
}
