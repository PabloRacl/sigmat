/**
 * [Estado Atual]: Repositório dedicado a gerenciar dados de Manutenção (Ordens de Serviço e logs associados).
 * [Dependências Técnicas]: Consome PrismaService.
 * [Histórico de Modificações]: Extração de lógica de banco de dados do MaintenanceService.
 * [Regras de Negócio Imutáveis]: Retornar entidades limpas; Encapsular todas as chamadas do Prisma.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { StatusManutencao, AcaoLog } from '@prisma/client';
import { CriarOrdemServicoDto } from './dto/manutencao.dto';

@Injectable()
export class MaintenanceRepository {
  constructor(private prisma: PrismaService) {}

  async findUsuarioCompleto(usuarioId: number) {
    return this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });
  }

  async findOrdensServico(whereClause: any) {
    return this.prisma.ordemServico.findMany({
      where: whereClause,
      include: {
        equipamento: {
          include: { tipoEquipamento: true, marca: true }
        },
        solicitante: true
      },
      orderBy: { dataAbertura: 'desc' }
    });
  }

  async findOrdemById(id: number) {
    return this.prisma.ordemServico.findUnique({
      where: { id },
      include: {
        equipamento: true,
        solicitante: true
      }
    });
  }

  async findEquipamentoById(id: number) {
    return this.prisma.equipamento.findUnique({
      where: { id },
      include: { secao: true }
    });
  }

  async getStatusManutencao() {
    return this.prisma.statusEquipamento.findFirst({
      where: { nome: 'MANUTENÇÃO' }
    });
  }

  async getStatusAtivo() {
    return this.prisma.statusEquipamento.findFirst({
      where: { nome: 'ATIVO' }
    });
  }

  async transaction(fn: (tx: any) => Promise<any>) {
    return this.prisma.$transaction(fn);
  }

  async getLogsByEquipamento(equipamentoId: number) {
    return this.prisma.logOperacao.findMany({
      where: { equipamentoId },
      include: {
        usuario: {
          select: { nome: true, matricula: true, postoGraduacao: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
