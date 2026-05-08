import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AcaoLog } from '@prisma/client';

import { AuditService } from '../../shared/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async criarSolicitacao(equipamentoId: number, solicitanteId: number, dadosNovos: any, dadosAntigos: any) {
    const camposAlterados = Object.keys(dadosNovos).filter(
      key => JSON.stringify(dadosNovos[key]) !== JSON.stringify(dadosAntigos[key])
    );

    if (camposAlterados.length === 0) {
      return { message: 'Nenhuma alteração detectada' };
    }

    const pendencia = await this.prisma.alteracaoPendente.create({
      data: {
        equipamentoId,
        solicitanteId,
        dadosAntigos,
        dadosNovos,
        camposAlterados,
      },
    });

    this.notificationsService.notificarAtualizacaoGlobal();

    return pendencia;
  }

  async listarPendentesPorUnidade(batalhaoId?: number) {
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

  async contarPendentes(batalhaoId?: number) {
    return this.prisma.alteracaoPendente.count({
      where: {
        aprovado: null,
        equipamento: batalhaoId ? { secao: { batalhaoId: batalhaoId } } : {},
      },
    });
  }

  async processarDecisao(id: number, aprovado: boolean, aprovadoPorId: number, motivoNegacao?: string) {
    const solicitacao = await this.prisma.alteracaoPendente.findUnique({
      where: { id },
      include: { equipamento: true }
    });

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
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
        const novos = solicitacao.dadosNovos as any;
        if (solicitacao.camposAlterados.includes('_acao') && novos._acao === 'DELETE') {
          await tx.equipamento.delete({
            where: { id: solicitacao.equipamentoId },
          });
        } else {
          const dadosParaAtualizar: any = {};
          solicitacao.camposAlterados.forEach(campo => {
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

      // Log direto no TX para evitar deadlock
      await tx.logOperacao.create({
        data: {
          usuarioId: aprovadoPorId,
          equipamentoId: solicitacao.equipamentoId,
          acao: aprovado ? AcaoLog.APPROVE : AcaoLog.REJECT,
          descricao: `${aprovado ? 'Aprovada' : 'Negada'} alteração para o equipamento ${solicitacao.equipamento.patrimonio}.`,
          dadosAlterados: {
            campos: solicitacao.camposAlterados,
            dadosNovos: solicitacao.dadosNovos,
            motivoNegacao: motivoNegacao || undefined
          },
        }
      });

      return pendencia;
    });

    // Notificações APÓS a transação ter sucesso
    this.notificationsService.notificarAtualizacaoGlobal();
    this.notificationsService.notificarDecisaoAlteracao(
      solicitacao.solicitanteId,
      aprovado,
      solicitacao.equipamento.patrimonio
    );

    return resultado;
  }
}



