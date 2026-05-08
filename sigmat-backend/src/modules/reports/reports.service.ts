import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async inventarioGeral(filtros: any, usuario: any) {
    // 1. Controle de Acesso (RBAC) - Mesma lógica do EquipmentService
    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.sub || usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull) return [];

    const where: any = {};
    const and: any[] = [];

    // Lógica de visibilidade por perfil
    if (userFull.perfil !== 'ADMIN_DTEC') {
      const secoesIds = [
        userFull.secaoId,
        ...userFull.secoesPermitidas.map(s => s.secaoId)
      ].filter(Boolean);

      if (userFull.perfil === 'DIRETORIA') {
        const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
        and.push({
          OR: [
            { secaoId: { in: secoesIds } },
            { secao: { diretoriaId } },
            { secao: { batalhao: { diretoriaId } } },
          ]
        });
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

    // 2. Filtros de Interface
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

    if (and.length > 0) where.AND = and;

    return this.prisma.equipamento.findMany({
      where,
      include: {
        tipoEquipamento: true,
        marca: true,
        modelo: true,
        status: true,
        tipoAquisicao: true,
        disponibilidade: true,
        secao: {
          include: {
            diretoria: true,
            batalhao: true,
          }
        },
      },
      orderBy: { patrimonio: 'asc' },
    });
  }

  async resumoPorUnidade() {
    // Retorna contagem de equipamentos agrupados por batalhão
    const batalhoes = await this.prisma.batalhao.findMany({
      include: {
        secoes: {
          include: {
            _count: { select: { equipamentos: true } }
          }
        }
      }
    });

    return batalhoes.map(b => ({
      sigla: b.sigla,
      total: b.secoes.reduce((acc, s) => acc + s._count.equipamentos, 0)
    }));
  }

  async logsAuditoria(dias: number = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    return this.prisma.logOperacao.findMany({
      where: { createdAt: { gte: dataLimite } },
      include: {
        usuario: { select: { nome: true, matricula: true } },
        equipamento: { select: { patrimonio: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}





