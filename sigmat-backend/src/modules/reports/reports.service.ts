/**
 * [Estado Atual]: Serviço para geração de relatórios consolidados e detalhados de inventário, transferências e auditoria.
 * [Dependências Técnicas]:
 *   - PrismaService (Banco de Dados)
 * [Histórico de Modificações]:
 *   - Totalmente otimizado para alta performance (Ultra Fast Queries) substituindo os 'include' genéricos por 'select' estritos e projetivos.
 * [Regras de Negócio Imutáveis]:
 *   - Respeitar a visibilidade de dados de acordo com o perfil e OME/batalhão do usuário logado (buildVisibilityConditions).
 *   - Manter compatibilidade exata de nomes de campos com o frontend para não quebrar exportações de PDF/CSV/Word.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildVisibilityConditions(usuario: any): Promise<any[]> {
    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.sub || usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull) return [];

    const and: any[] = [];
    if (userFull.perfil !== 'ADMIN_DTEC') {
      const secoesIds = [
        userFull.secaoId,
        ...userFull.secoesPermitidas.map(s => s.secaoId)
      ].filter(Boolean);

      if (userFull.perfil === 'DIRETORIA') {
        const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
        const or: any[] = [];

        // Diretoria vê equipamentos ligados diretamente a ela e também aos batalhões subordinados.
        if (secoesIds.length > 0) {
          or.push({ secaoId: { in: secoesIds } });
        }
        if (diretoriaId) {
          or.push({ secao: { diretoriaId } });
          or.push({ secao: { batalhao: { diretoriaId } } });
        }

        and.push(or.length > 0 ? { OR: or } : { secaoId: -1 });
      } else if (userFull.batalhaoId) {
        and.push({
          OR: [
            { secaoId: { in: secoesIds } },
            { secao: { batalhaoId: userFull.batalhaoId } }
          ]
        });
      } else {
        and.push({ secaoId: { in: secoesIds.length > 0 ? secoesIds : [-1] } });
      }
    }

    return and;
  }

  async inventarioGeral(filtros: any, usuario: any) {
    const and: any[] = await this.buildVisibilityConditions(usuario);

    if (filtros.secaoId) and.push({ secaoId: Number(filtros.secaoId) });
    if (filtros.tipoId) and.push({ tipoEquipamentoId: Number(filtros.tipoId) });
    if (filtros.statusId) and.push({ statusId: Number(filtros.statusId) });
    if (filtros.disponibilidadeId) and.push({ disponibilidadeId: Number(filtros.disponibilidadeId) });
    
    if (filtros.busca) {
      and.push({
        OR: [
          { patrimonio: { contains: filtros.busca, mode: 'insensitive' } },
          { numeroSerie: { contains: filtros.busca, mode: 'insensitive' } },
          { sei: { contains: filtros.busca, mode: 'insensitive' } },
          { marca: { nome: { contains: filtros.busca, mode: 'insensitive' } } },
          { modelo: { nome: { contains: filtros.busca, mode: 'insensitive' } } },
          { secao: { sigla: { contains: filtros.busca, mode: 'insensitive' } } },
        ],
      });
    }

    const where: any = and.length > 0 ? { AND: and } : {};

    // OTIMIZAÇÃO: Select estrito projetado para eliminar download de campos JSON pesados (especificacoes, fotos)
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
            diretoria: { select: { id: true, sigla: true, nome: true } }
          }
        }
      },
      orderBy: { patrimonio: 'asc' },
    });
  }

  async resumoPorUnidade(usuario: any) {
    const and: any[] = await this.buildVisibilityConditions(usuario);
    const where: any = and.length > 0 ? { AND: and } : {};

    const counts = await this.prisma.equipamento.groupBy({
      by: ['secaoId'],
      where,
      _count: { _all: true }
    });

    if (counts.length === 0) return [];

    const secoes = await this.prisma.secao.findMany({
      where: { id: { in: counts.map(c => c.secaoId) } },
      include: { batalhao: true, diretoria: true }
    });

    const totalsByBatalhao: Record<string, number> = {};
    counts.forEach(count => {
      const secao = secoes.find(s => s.id === count.secaoId);
      const sigla = secao?.batalhao?.sigla || secao?.diretoria?.sigla || 'Sem Unidade';
      totalsByBatalhao[sigla] = (totalsByBatalhao[sigla] || 0) + count._count._all;
    });

    return Object.entries(totalsByBatalhao).map(([sigla, total]) => ({ sigla, total }));
  }

  private async buildTransferVisibility(usuario: any): Promise<any> {
    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.sub || usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull || userFull.perfil === 'ADMIN_DTEC') return {};

    const secoesIds = [
      userFull.secaoId,
      ...userFull.secoesPermitidas.map(s => s.secaoId)
    ].filter(Boolean);

    const or: any[] = [
      { origemId: { in: secoesIds } },
      { destinoId: { in: secoesIds } },
    ];

    if (userFull.perfil === 'DIRETORIA') {
      const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
      if (diretoriaId) {
        or.push({ origem: { diretoriaId } });
        or.push({ destino: { diretoriaId } });
        or.push({ origem: { batalhao: { diretoriaId } } });
        or.push({ destino: { batalhao: { diretoriaId } } });
      }
    } else if (userFull.batalhaoId) {
      or.push({ origem: { batalhaoId: userFull.batalhaoId } });
      or.push({ destino: { batalhaoId: userFull.batalhaoId } });
    }

    if (or.length === 0) {
      return { OR: [{ origemId: -1 }] };
    }

    return { OR: or };
  }

  async transferencias(filtros: any, usuario: any) {
    const where: any = {};
    const transferVisibility = await this.buildTransferVisibility(usuario);
    if (Object.keys(transferVisibility).length > 0) {
      where.AND = [transferVisibility];
    }

    if (filtros.status) {
      const statuses = String(filtros.status).split(',').map((s: string) => s.trim().toUpperCase());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (filtros.origemId) where.origemId = Number(filtros.origemId);
    if (filtros.destinoId) where.destinoId = Number(filtros.destinoId);
    if (filtros.patrimonio) {
      where.equipamento = {
        patrimonio: { contains: String(filtros.patrimonio), mode: 'insensitive' }
      };
    }

    if (filtros.solicitante) {
      where.solicitante = {
        OR: [
          { nome: { contains: String(filtros.solicitante), mode: 'insensitive' } },
          { matricula: { contains: String(filtros.solicitante), mode: 'insensitive' } }
        ]
      };
    }

    if (filtros.recebedor) {
      where.recebedor = {
        OR: [
          { nome: { contains: String(filtros.recebedor), mode: 'insensitive' } },
          { matricula: { contains: String(filtros.recebedor), mode: 'insensitive' } }
        ]
      };
    }

    if (filtros.dataEnvioInicio || filtros.dataEnvioFim) {
      where.dataEnvio = {} as any;
      if (filtros.dataEnvioInicio) where.dataEnvio.gte = new Date(filtros.dataEnvioInicio);
      if (filtros.dataEnvioFim) {
        const fim = new Date(filtros.dataEnvioFim);
        fim.setHours(23, 59, 59, 999);
        where.dataEnvio.lte = fim;
      }
    }

    if (filtros.lote) {
      const valorLote = String(filtros.lote).trim();
      const orFilter: any[] = [
        { observacao: { contains: valorLote, mode: 'insensitive' } }
      ];

      if (/^\d+$/.test(valorLote)) {
        orFilter.unshift({ id: Number(valorLote) });
      }

      if (!where.AND) where.AND = [];
      where.AND.push({ OR: orFilter });
    }

    if (filtros.dataRecebimentoInicio || filtros.dataRecebimentoFim) {
      where.dataRecebimento = {} as any;
      if (filtros.dataRecebimentoInicio) where.dataRecebimento.gte = new Date(filtros.dataRecebimentoInicio);
      if (filtros.dataRecebimentoFim) {
        const fim = new Date(filtros.dataRecebimentoFim);
        fim.setHours(23, 59, 59, 999);
        where.dataRecebimento.lte = fim;
      }
    }

    // OTIMIZAÇÃO: Select estrito em substituição a include com junções de tabelas gigantes
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
        recebedor: { select: { id: true, nome: true, matricula: true } }
      },
      orderBy: { dataEnvio: 'desc' }
    });
  }

  async logsAuditoria(filters: any = {}, usuario?: any) {
    const where: any = {};

    // Filtro de visibilidade por perfil/unidade
    if (usuario) {
      const userFull = await this.prisma.usuario.findUnique({
        where: { id: usuario.sub || usuario.id },
        include: { secao: true, batalhao: true, secoesPermitidas: true },
      });

      if (userFull && userFull.perfil !== 'ADMIN_DTEC') {
        const secoesIds = [
          userFull.secaoId,
          ...userFull.secoesPermitidas.map(s => s.secaoId)
        ].filter(Boolean);

        if (userFull.perfil === 'DIRETORIA') {
          const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
          const or: any[] = [];

          if (secoesIds.length > 0) {
            or.push({ secaoId: { in: secoesIds } });
          }
          if (diretoriaId) {
            or.push({ secao: { diretoriaId } });
            or.push({ secao: { batalhao: { diretoriaId } } });
          }

          where.equipamento = or.length > 0 ? { OR: or } : { secaoId: -1 };
        } else if (userFull.batalhaoId) {
          where.equipamento = {
            OR: [
              { secaoId: { in: secoesIds } },
              { secao: { batalhaoId: userFull.batalhaoId } }
            ]
          };
        } else {
          where.equipamento = { secaoId: { in: secoesIds.length > 0 ? secoesIds : [-1] } };
        }
      }
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
      const acoes = String(filters.acao).split(',').map((s: string) => s.trim().toUpperCase());
      if (acoes.length === 1) where.acao = acoes[0];
      else where.acao = { in: acoes };
    }

    if (filters.usuario) {
      where.usuario = {
        OR: [
          { nome: { contains: String(filters.usuario), mode: 'insensitive' } },
          { matricula: { contains: String(filters.usuario), mode: 'insensitive' } }
        ]
      };
    }

    if (filters.patrimonio) {
      // Merge com filtro de visibilidade se existir
      const patrimonioFilter = { patrimonio: { contains: String(filters.patrimonio), mode: 'insensitive' } };
      if (where.equipamento) {
        where.equipamento = { AND: [where.equipamento, patrimonioFilter] };
      } else {
        where.equipamento = patrimonioFilter;
      }
    }

    if (filters.descricao) {
      where.descricao = { contains: String(filters.descricao), mode: 'insensitive' };
    }

    // OTIMIZAÇÃO: Select cirúrgico de propriedades
    return this.prisma.logOperacao.findMany({
      where,
      select: {
        id: true,
        acao: true,
        descricao: true,
        createdAt: true,
        usuario: { select: { nome: true, matricula: true } },
        equipamento: { select: { patrimonio: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
