import { Injectable } from '@nestjs/common';
import { IAprovacaoRepositorio } from './aprovacoes.repository.interface';
import { PrismaService } from '../../../banco-dados/prisma.service';
import { AcaoLog } from '@prisma/client';
import { AuditService } from '../../../compartilhado/servicos/audit.service';

@Injectable()
export class AprovacaoRepositorioPrisma implements IAprovacaoRepositorio {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async criar(
    equipamentoId: number,
    solicitanteId: number,
    dadosNovos: any,
    dadosAntigos: any,
    camposAlterados: string[],
  ): Promise<any> {
    return this.prisma.alteracaoPendente.create({
      data: {
        equipamentoId,
        solicitanteId,
        dadosAntigos,
        dadosNovos,
        camposAlterados,
      },
    });
  }

  async listarPendentesPorUnidade(batalhaoId?: number): Promise<any[]> {
    return this.prisma.alteracaoPendente.findMany({
      where: {
        aprovado: null,
        equipamento: batalhaoId ? { secao: { batalhaoId: batalhaoId } } : {},
      },
      include: {
        equipamento: true,
        solicitante: true,
      },
    });
  }

  async contarPendentes(batalhaoId?: number): Promise<number> {
    return this.prisma.alteracaoPendente.count({
      where: {
        aprovado: null,
        equipamento: batalhaoId ? { secao: { batalhaoId: batalhaoId } } : {},
      },
    });
  }

  async obterPendencia(id: number): Promise<any> {
    return this.prisma.alteracaoPendente.findUnique({
      where: { id },
      include: {
        equipamento: { include: { secao: true } },
        solicitante: true,
        aprovadoPor: true,
      },
    });
  }

  async processarDecisao(
    id: number,
    aprovado: boolean,
    aprovadoPorId: number,
    motivoNegacao?: string,
    dadosTransacao?: any,
  ): Promise<any> {
    const { solicitacao } = dadosTransacao;
    return this.prisma.$transaction(async (tx) => {
      const pendencia = await tx.alteracaoPendente.update({
        where: { id },
        data: {
          aprovado,
          aprovadoPorId,
          motivoNegacao,
          dataAprovacao: new Date(),
        },
      });

      if (aprovado) {
        const novos = solicitacao.dadosNovos;
        if (
          solicitacao.camposAlterados.includes('_acao') &&
          novos._acao === 'DELETE'
        ) {
          await tx.equipamento.delete({
            where: { id: solicitacao.equipamentoId },
          });
        } else {
          const dadosParaAtualizar: any = {};
          solicitacao.camposAlterados.forEach((campo: string) => {
            if (novos[campo] !== undefined) {
              dadosParaAtualizar[campo] = novos[campo];
            }
          });

          await tx.equipamento.update({
            where: { id: solicitacao.equipamentoId },
            data: dadosParaAtualizar,
          });
        }
      }

      const dadosAlteradosNormalizados =
        await this.auditService.normalizarDadosParaLog({
          campos: solicitacao.camposAlterados,
          dadosNovos: solicitacao.dadosNovos,
          motivoNegacao: motivoNegacao || undefined,
        });

      await tx.logOperacao.create({
        data: {
          usuarioId: aprovadoPorId,
          equipamentoId: solicitacao.equipamentoId,
          acao: aprovado ? AcaoLog.APPROVE : AcaoLog.REJECT,
          descricao: `${aprovado ? 'Aprovada' : 'Negada'} alteração para o equipamento ${solicitacao.equipamento.patrimonio}.`,
          dadosAlterados: dadosAlteradosNormalizados,
        },
      });

      return pendencia;
    });
  }
}
