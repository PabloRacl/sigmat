/**
 * [Estado Atual]: Serviço para gerenciamento de solicitações, cancelamentos e confirmações de transferências e empréstimos de equipamentos.
 * [Dependências Técnicas]:
 *   - TransfersRepository
 *   - AuditService
 *   - NotificationsService
 * [Histórico de Modificações]:
 *   - Refatorado para o padrão Service/Repository, delegando acesso ao Prisma para o TransfersRepository.
 *   - Injetados os cabeçalhos de contexto arquitetural.
 * [Regras de Negócio Imutáveis]:
 *   - Apenas administradores e comandantes podem autorizar transferências.
 *   - O Batalhão do comandante deve coincidir com a seção destino da transferência.
 *   - A seção (secaoId) do equipamento só é alterada quando o destino confirma o recebimento.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TransfersRepository } from './movimentacoes.repository';
import { StatusTransferencia, PerfilUsuario, AcaoLog } from '@prisma/client';
import { AuditService } from '../../compartilhado/servicos/audit.service';
import { NotificationsService } from '../notificacoes/notificacoes.service';

@Injectable()
export class TransfersService {
  constructor(
    private readonly repository: TransfersRepository,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async solicitar(
    equipamentoId: number,
    destinoId: number,
    solicitanteId: number,
    usuario: any,
    observacao?: string,
  ) {
    const equipamento = await this.repository.findEquipamentoUnique({
      where: { id: equipamentoId },
      include: { secao: true },
    });

    if (!equipamento) throw new NotFoundException('Equipamento não encontrado');

    if (usuario.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException(
        'Usuários de Diretoria não podem iniciar transferências.',
      );
    }

    if (usuario.perfil !== PerfilUsuario.ADMIN_DTEC) {
      const userBatalhaoId = usuario.batalhaoId;
      if (!userBatalhaoId || equipamento.secao?.batalhaoId !== userBatalhaoId) {
        throw new ForbiddenException(
          'Você só pode solicitar transferências para equipamentos da sua unidade.',
        );
      }
    }

    const pendencia = await this.repository.create({
      data: {
        equipamentoId,
        origemId: equipamento.secaoId,
        destinoId,
        solicitanteId,
        status: 'PENDENTE',
        observacao,
      },
      include: {
        equipamento: true,
        origem: true,
        destino: true,
        solicitante: true,
      },
    });

    this.notificationsService.notificarAtualizacaoGlobal();

    return pendencia;
  }

  async solicitarEmMassa(
    equipamentoIds: number[],
    destinoId: number,
    solicitanteId: number,
    usuario: any,
    observacao?: string,
    disponibilidadeId?: number,
    solicitante?: string,
    dataSolicitacao?: string,
    dataRetornoEmprestimo?: string,
  ) {
    if (usuario.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException(
        'Usuários de Diretoria não podem iniciar transferências.',
      );
    }

    return this.repository.client.$transaction(async (tx: any) => {
      const transferencias = [];

      for (const id of equipamentoIds) {
        const equipamento = await tx.equipamento.findUnique({
          where: { id },
          include: { secao: true },
        });
        if (!equipamento)
          throw new NotFoundException(`Equipamento ID ${id} não encontrado`);

        if (usuario.perfil !== PerfilUsuario.ADMIN_DTEC) {
          const userBatalhaoId = usuario.batalhaoId;
          if (
            !userBatalhaoId ||
            equipamento.secao?.batalhaoId !== userBatalhaoId
          ) {
            throw new ForbiddenException(
              'Você só pode solicitar transferências para equipamentos da sua unidade.',
            );
          }
        }

        const t = await tx.transferencia.create({
          data: {
            equipamentoId: id,
            origemId: equipamento.secaoId,
            destinoId,
            solicitanteId,
            status: 'PENDENTE',
            observacao,
          },
        });

        const equipUpdate: any = {};
        if (disponibilidadeId)
          equipUpdate.disponibilidadeId = disponibilidadeId;
        if (solicitante) equipUpdate.solicitante = solicitante;
        if (dataSolicitacao)
          equipUpdate.dataSolicitacao = new Date(dataSolicitacao);
        if (dataRetornoEmprestimo)
          equipUpdate.dataRetornoEmprestimo = new Date(dataRetornoEmprestimo);

        if (Object.keys(equipUpdate).length > 0) {
          await tx.equipamento.update({ where: { id }, data: equipUpdate });
        }

        transferencias.push(t);
      }

      this.notificationsService.notificarAtualizacaoGlobal();

      return transferencias;
    });
  }

  async listarPendentesPorUsuario(usuario: any) {
    let filtroDestino: any = {};

    if (usuario.perfil === 'ADMIN_DTEC') {
      filtroDestino = {};
    } else if (
      usuario.batalhaoId &&
      (usuario.perfil === 'COMANDANTE' || usuario.perfil === 'USUARIO_BATALHAO')
    ) {
      filtroDestino = { destino: { batalhaoId: usuario.batalhaoId } };
    } else {
      filtroDestino = { destinoId: usuario.secaoId };
    }

    return this.repository.findMany({
      where: {
        ...filtroDestino,
        status: 'PENDENTE',
      },
      include: {
        equipamento: {
          include: { tipoEquipamento: true },
        },
        origem: true,
        destino: true,
        solicitante: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmarRecebimento(transferenciaId: number, recebedor: any) {
    const transferencia = await this.repository.findUnique({
      where: { id: transferenciaId },
    });

    if (!transferencia)
      throw new NotFoundException('Transferência não encontrada');
    if (transferencia.status !== 'PENDENTE')
      throw new BadRequestException('Transferência já processada');

    if (
      recebedor.perfil !== 'COMANDANTE' &&
      recebedor.perfil !== 'ADMIN_DTEC'
    ) {
      throw new ForbiddenException(
        'Apenas Comandantes ou Administradores podem aprovar recebimentos.',
      );
    }

    if (recebedor.perfil === 'COMANDANTE' && recebedor.batalhaoId) {
      const secaoDestino = await this.repository.findSecaoUnique({
        where: { id: transferencia.destinoId },
      });
      if (secaoDestino?.batalhaoId !== recebedor.batalhaoId) {
        throw new ForbiddenException(
          'Você só pode aprovar transferências destinadas ao seu Batalhão.',
        );
      }
    }

    return this.repository.client.$transaction(async (tx: any) => {
      const t = await tx.transferencia.update({
        where: { id: transferenciaId },
        data: {
          status: 'CONCLUIDA',
          recebedorId: recebedor.id,
          dataRecebimento: new Date(),
        },
      });

      await tx.equipamento.update({
        where: { id: transferencia.equipamentoId },
        data: { secaoId: transferencia.destinoId },
      });

      await tx.logOperacao.create({
        data: {
          equipamentoId: transferencia.equipamentoId,
          usuarioId: recebedor.id,
          acao: AcaoLog.TRANSFERENCIA_CONCLUIDA,
          descricao: `Material recebido na unidade ${transferencia.destinoId}. Origem: ${transferencia.origemId}`,
        },
      });

      return t;
    });
  }

  async cancelar(transferenciaId: number, usuario: any) {
    const transferencia = await this.repository.findUnique({
      where: { id: transferenciaId },
    });

    if (!transferencia)
      throw new NotFoundException('Transferência não encontrada');
    if (transferencia.status !== 'PENDENTE')
      throw new BadRequestException(
        'Apenas transferências pendentes podem ser canceladas',
      );

    if (
      usuario.perfil !== PerfilUsuario.ADMIN_DTEC &&
      transferencia.solicitanteId !== usuario.id
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar esta transferência.',
      );
    }

    const t = await this.repository.update({
      where: { id: transferenciaId },
      data: { status: 'CANCELADA' },
    });

    await this.auditService.registrarLog({
      usuarioId: usuario.id,
      equipamentoId: transferencia.equipamentoId,
      acao: AcaoLog.DELETE,
      descricao: `Transferência #${transferenciaId} cancelada pelo usuário.`,
    });

    return t;
  }
}
