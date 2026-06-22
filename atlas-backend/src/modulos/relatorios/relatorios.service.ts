import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { PermissoesService } from '../compartilhado/permissoes.service';
import { PerfilUsuario } from '@prisma/client';

/**
 * Serviço para geração de relatórios consolidados e detalhados de inventário,
 * transferências e auditoria. A responsabilidade de calcular as condições de
 * visibilidade foi delegada ao {@link PermissoesService}.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissoesService: PermissoesService,
  ) {}

  // ---------------------------------------------------------------------
  // Inventário geral
  // ---------------------------------------------------------------------
  async inventarioGeral(filtros: any, usuario: any) {
    // Obtém as condições de visibilidade a partir do serviço centralizado
    const visibilidade =
      await this.permissoesService.construirCondicoesVisibilidadeEquipamento(
        usuario,
      );
    const and: any[] = [...visibilidade];

    if (filtros.secaoId) and.push({ secaoId: Number(filtros.secaoId) });

    // Filtro em Cascata (Hierarquia)
    if (filtros.diretoriaId) {
      and.push({
        OR: [
          { secao: { diretoriaId: Number(filtros.diretoriaId) } },
          { secao: { batalhao: { diretoriaId: Number(filtros.diretoriaId) } } },
          { batalhao: { diretoriaId: Number(filtros.diretoriaId) } }
        ]
      });
    }

    if (filtros.batalhaoId) {
      and.push({
        OR: [
          { secao: { batalhaoId: Number(filtros.batalhaoId) } },
          { batalhaoId: Number(filtros.batalhaoId) }
        ]
      });
    }

    if (filtros.tipoId) and.push({ tipoEquipamentoId: Number(filtros.tipoId) });
    if (filtros.statusId) and.push({ statusId: Number(filtros.statusId) });
    if (filtros.disponibilidadeId)
      and.push({ disponibilidadeId: Number(filtros.disponibilidadeId) });

    if (filtros.busca) {
      and.push({
        OR: [
          { patrimonio: { contains: filtros.busca, mode: 'insensitive' } },
          { numeroSerie: { contains: filtros.busca, mode: 'insensitive' } },
          { sei: { contains: filtros.busca, mode: 'insensitive' } },
          { marca: { nome: { contains: filtros.busca, mode: 'insensitive' } } },
          {
            modelo: { nome: { contains: filtros.busca, mode: 'insensitive' } },
          },
          {
            secao: { sigla: { contains: filtros.busca, mode: 'insensitive' } },
          },
        ],
      });
    }

    const where: any = and.length > 0 ? { AND: and } : {};

    // SELECT estrito para evitar carregamento de JSON pesado
    return this.prisma.equipamento.findMany({
      where,
      select: {
        id: true,
        patrimonio: true,
        numeroSerie: true,
        sei: true,
        dataAquisicao: true,
        observacao: true,
        solicitante: true,
        dataSolicitacao: true,
        dataRetornoEmprestimo: true,
        tipoEquipamento: { select: { id: true, nome: true } },
        marca: { select: { id: true, nome: true } },
        modelo: { select: { id: true, nome: true } },
        status: { select: { id: true, nome: true } },
        tipoAquisicao: { select: { id: true, nome: true } },
        disponibilidade: { select: { id: true, nome: true } },
        secao: {
          select: {
            id: true,
            sigla: true,
            nome: true,
            batalhao: { select: { id: true, sigla: true, nome: true } },
            diretoria: { select: { id: true, sigla: true, nome: true } },
          },
        },
      },
      orderBy: { patrimonio: 'asc' },
    });
  }
  // ---------------------------------------------------------------------
  // Resumo por Unidade
  // ---------------------------------------------------------------------
  async resumoPorUnidade(usuario: any) {
    const visibilidade =
      await this.permissoesService.construirCondicoesVisibilidadeEquipamento(
        usuario,
      );
    const where: any = visibilidade.length > 0 ? { AND: visibilidade } : {};

    const counts = await this.prisma.equipamento.groupBy({
      by: ['secaoId'],
      where,
      _count: { _all: true },
    });

    if (counts.length === 0) return [];

    const secoes = await this.prisma.secao.findMany({
      where: { id: { in: counts.map((c) => c.secaoId) } },
      select: {
        id: true,
        batalhao: { select: { sigla: true } },
        diretoria: { select: { sigla: true } },
      },
    });

    const totals: Record<string, number> = {};
    counts.forEach((count) => {
      const secao = secoes.find((s) => s.id === count.secaoId);
      const sigla =
        secao?.batalhao?.sigla || secao?.diretoria?.sigla || 'Sem Unidade';
      totals[sigla] = (totals[sigla] || 0) + count._count._all;
    });

    return Object.entries(totals).map(([sigla, total]) => ({ sigla, total }));
  }

  // ---------------------------------------------------------------------
  // Transferências
  // ---------------------------------------------------------------------
  async transferencias(filtros: any, usuario: any) {
    const where: any = {};
    const visibilidade =
      await this.permissoesService.construirCondicoesVisibilidadeTransferencia(
        usuario,
      );
    if (Object.keys(visibilidade).length > 0) {
      where.AND = [visibilidade];
    }

    if (filtros.status) {
      const statuses = String(filtros.status)
        .split(',')
        .map((s: string) => s.trim().toUpperCase());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (filtros.origemId) where.origemId = Number(filtros.origemId);
    if (filtros.destinoId) where.destinoId = Number(filtros.destinoId);
    if (filtros.patrimonio) {
      where.equipamento = {
        patrimonio: {
          contains: String(filtros.patrimonio),
          mode: 'insensitive',
        },
      };
    }
    if (filtros.solicitante) {
      where.solicitante = {
        OR: [
          {
            nome: {
              contains: String(filtros.solicitante),
              mode: 'insensitive',
            },
          },
          {
            matricula: {
              contains: String(filtros.solicitante),
              mode: 'insensitive',
            },
          },
        ],
      };
    }
    if (filtros.recebedor) {
      where.recebedor = {
        OR: [
          {
            nome: { contains: String(filtros.recebedor), mode: 'insensitive' },
          },
          {
            matricula: {
              contains: String(filtros.recebedor),
              mode: 'insensitive',
            },
          },
        ],
      };
    }
    if (filtros.dataEnvioInicio || filtros.dataEnvioFim) {
      where.dataEnvio = {} as any;
      if (filtros.dataEnvioInicio)
        where.dataEnvio.gte = new Date(filtros.dataEnvioInicio);
      if (filtros.dataEnvioFim) {
        const fim = new Date(filtros.dataEnvioFim);
        fim.setHours(23, 59, 59, 999);
        where.dataEnvio.lte = fim;
      }
    }
    if (filtros.lote) {
      const valorLote = String(filtros.lote).trim();
      const orFilter: any[] = [
        { observacao: { contains: valorLote, mode: 'insensitive' } },
      ];
      if (/^\d+$/.test(valorLote)) {
        orFilter.unshift({ id: Number(valorLote) });
      }
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: orFilter });
    }
    if (filtros.dataRecebimentoInicio || filtros.dataRecebimentoFim) {
      where.dataRecebimento = {} as any;
      if (filtros.dataRecebimentoInicio)
        where.dataRecebimento.gte = new Date(filtros.dataRecebimentoInicio);
      if (filtros.dataRecebimentoFim) {
        const fim = new Date(filtros.dataRecebimentoFim);
        fim.setHours(23, 59, 59, 999);
        where.dataRecebimento.lte = fim;
      }
    }

    return this.prisma.transferencia.findMany({
      where,
      select: {
        id: true,
        status: true,
        observacao: true,
        dataEnvio: true,
        dataRecebimento: true,
        equipamento: { select: { id: true, patrimonio: true } },
        origem: { select: { id: true, sigla: true, nome: true } },
        destino: { select: { id: true, sigla: true, nome: true } },
        solicitante: { select: { id: true, nome: true, matricula: true } },
        recebedor: { select: { id: true, nome: true, matricula: true } },
      },
      orderBy: { dataEnvio: 'desc' },
    });
  }

  // ---------------------------------------------------------------------
  // Logs de auditoria
  // ---------------------------------------------------------------------
  async logsAuditoria(filters: any = {}, usuario?: any) {
    const where: any = {};
    // Visibilidade baseada no usuário
    if (usuario) {
      const visibilidade =
        await this.permissoesService.construirCondicoesVisibilidadeAuditoria(
          usuario,
        );
      Object.assign(where, visibilidade);
    }

    if (filters.startDate || filters.endDate) {
      const gte = filters.startDate ? new Date(filters.startDate) : undefined;
      const lte = filters.endDate ? new Date(filters.endDate) : undefined;
      where.createdAt = {} as any;
      if (gte) where.createdAt.gte = gte;
      if (lte) where.createdAt.lte = lte;
    } else if (filters.dias) {
      const dias = Number(filters.dias);
      if (!Number.isNaN(dias) && dias > 0) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);
        where.createdAt = { gte: dataLimite };
      }
    }

    if (filters.acao) {
      const acoes = String(filters.acao)
        .split(',')
        .map((s: string) => s.trim().toUpperCase());
      where.acao = acoes.length === 1 ? acoes[0] : { in: acoes };
    }
    if (filters.usuario) {
      where.usuario = {
        OR: [
          { nome: { contains: String(filters.usuario), mode: 'insensitive' } },
          {
            matricula: {
              contains: String(filters.usuario),
              mode: 'insensitive',
            },
          },
        ],
      };
    }
    if (filters.patrimonio) {
      const patrimonioFilter = {
        patrimonio: {
          contains: String(filters.patrimonio),
          mode: 'insensitive',
        },
      };
      if (where.equipamento) {
        where.equipamento = { AND: [where.equipamento, patrimonioFilter] };
      } else {
        where.equipamento = patrimonioFilter;
      }
    }
    if (filters.descricao) {
      where.descricao = {
        contains: String(filters.descricao),
        mode: 'insensitive',
      };
    }

    return this.prisma.logOperacao.findMany({
      where,
      select: {
        id: true,
        acao: true,
        descricao: true,
        createdAt: true,
        dadosAlterados: true,
        ip: true,
        userAgent: true,
        usuario: { select: { nome: true, matricula: true } },
        equipamento: { select: { patrimonio: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
