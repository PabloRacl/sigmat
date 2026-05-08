import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StatusTransferencia, PerfilUsuario, AcaoLog } from '@prisma/client';
import { AuditService } from '../../shared/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async solicitar(equipamentoId: number, destinoId: number, solicitanteId: number, observacao?: string) {
    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id: equipamentoId },
    });

    if (!equipamento) throw new NotFoundException('Equipamento não encontrado');

    const pendencia = await this.prisma.transferencia.create({
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
    observacao?: string,
    disponibilidadeId?: number,
    solicitante?: string,
    dataSolicitacao?: string,
    dataRetornoEmprestimo?: string,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const transferencias = [];

      for (const id of equipamentoIds) {
        const equipamento = await tx.equipamento.findUnique({ where: { id } });
        if (!equipamento) throw new NotFoundException(`Equipamento ID ${id} não encontrado`);

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

        // Atualiza campos de disponibilidade e empréstimo no equipamento, mas NÃO a seção!
        // A seção (secaoId) só muda quando o destino confirma o recebimento.
        const equipUpdate: any = {};
        if (disponibilidadeId) equipUpdate.disponibilidadeId = disponibilidadeId;
        if (solicitante) equipUpdate.solicitante = solicitante;
        if (dataSolicitacao) equipUpdate.dataSolicitacao = new Date(dataSolicitacao);
        if (dataRetornoEmprestimo) equipUpdate.dataRetornoEmprestimo = new Date(dataRetornoEmprestimo);

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
    } else if (usuario.batalhaoId && (usuario.perfil === 'COMANDANTE' || usuario.perfil === 'USUARIO_BATALHAO')) {
      filtroDestino = { destino: { batalhaoId: usuario.batalhaoId } };
    } else {
      filtroDestino = { destinoId: usuario.secaoId };
    }

    return this.prisma.transferencia.findMany({
      where: {
        ...filtroDestino,
        status: 'PENDENTE',
      },
      include: {
        equipamento: {
          include: { tipoEquipamento: true }
        },
        origem: true,
        destino: true,
        solicitante: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmarRecebimento(transferenciaId: number, recebedor: any) {
    const transferencia = await this.prisma.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!transferencia) throw new NotFoundException('Transferência não encontrada');
    if (transferencia.status !== 'PENDENTE') throw new BadRequestException('Transferência já processada');

    if (recebedor.perfil !== 'COMANDANTE' && recebedor.perfil !== 'ADMIN_DTEC') {
      throw new ForbiddenException('Apenas Comandantes ou Administradores podem aprovar recebimentos.');
    }

    if (recebedor.perfil === 'COMANDANTE' && recebedor.batalhaoId) {
      const secaoDestino = await this.prisma.secao.findUnique({
        where: { id: transferencia.destinoId }
      });
      if (secaoDestino?.batalhaoId !== recebedor.batalhaoId) {
        throw new ForbiddenException('Você só pode aprovar transferências destinadas ao seu Batalhão.');
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Atualiza a transferência
      const t = await tx.transferencia.update({
        where: { id: transferenciaId },
        data: {
          status: 'CONCLUIDA',
          recebedorId: recebedor.id,
          dataRecebimento: new Date(),
        },
      });

      // 2. Atualiza a seção do equipamento
      await tx.equipamento.update({
        where: { id: transferencia.equipamentoId },
        data: { secaoId: transferencia.destinoId },
      });

      // 3. Log de auditoria
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
    const transferencia = await this.prisma.transferencia.findUnique({
      where: { id: transferenciaId },
    });

    if (!transferencia) throw new NotFoundException('Transferência não encontrada');
    if (transferencia.status !== 'PENDENTE') throw new BadRequestException('Apenas transferências pendentes podem ser canceladas');

    // Segurança: Apenas o solicitante ou ADMIN_DTEC podem cancelar
    if (usuario.perfil !== PerfilUsuario.ADMIN_DTEC && transferencia.solicitanteId !== usuario.id) {
      throw new ForbiddenException('Você não tem permissão para cancelar esta transferência.');
    }

    const t = await this.prisma.transferencia.update({
      where: { id: transferenciaId },
      data: { status: 'CANCELADA' },
    });

    await this.auditService.registrarLog({
      usuarioId: usuario.id,
      equipamentoId: transferencia.equipamentoId,
      acao: AcaoLog.DELETE, // Ou criar uma acao TRANSFER_CANCEL se preferir
      descricao: `Transferência #${transferenciaId} cancelada pelo usuário.`,
    });

    return t;
  }
}





