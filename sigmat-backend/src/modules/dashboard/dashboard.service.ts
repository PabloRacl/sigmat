import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obterEstatisticas(usuario: any) {
    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.sub || usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    const equipamentoWhere: any = {};
    const and: any[] = [];

    if (userFull && userFull.perfil !== 'ADMIN_DTEC') {
      const secoesIds = [
        userFull.secaoId,
        ...userFull.secoesPermitidas.map((s: any) => s.secaoId)
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
        if (secoesIds.length > 0) {
          and.push({ secaoId: { in: secoesIds } });
        } else {
          and.push({ secaoId: -1 });
        }
      }
    }

    if (and.length > 0) {
      equipamentoWhere.AND = and;
    }

    const [
      totalEquipamentos,
      porStatus,
      porTipo,
      porDisponibilidade,
      batalhoes,
      marcas,
    ] = await Promise.all([
      this.prisma.equipamento.count({ where: equipamentoWhere }),
      this.prisma.statusEquipamento.findMany({
        include: { _count: { select: { equipamentos: { where: equipamentoWhere } } } },
      }),
      this.prisma.tipoEquipamento.findMany({
        include: { _count: { select: { equipamentos: { where: equipamentoWhere } } } },
      }),
      this.prisma.disponibilidade.findMany({
        include: { _count: { select: { equipamentos: { where: equipamentoWhere } } } },
      }),
      this.prisma.batalhao.findMany({
        include: {
          secoes: {
            include: {
              _count: { select: { equipamentos: { where: equipamentoWhere } } },
            },
          },
        },
      }),
      this.prisma.marca.findMany({
        include: {
          modelos: {
            include: {
              _count: { select: { equipamentos: { where: equipamentoWhere } } }
            }
          }
        }
      }),
    ]);

    // Ordenar tipo pós-fetch já que o prisma não suporta order by count de relation com filtro
    porTipo.sort((a: any, b: any) => b._count.equipamentos - a._count.equipamentos);
    const top10Tipos = porTipo.slice(0, 10);

    // Totais por status
    const totalAtivos = porStatus.find((s: any) => s.nome === 'ATIVO')?._count?.equipamentos ?? 0;
    const totalManutencao = porStatus.find((s: any) => s.nome === 'MANUTENÇÃO')?._count?.equipamentos ?? 0;
    const totalInativos = porStatus.find((s: any) => s.nome === 'INATIVO')?._count?.equipamentos ?? 0;
    const totalEmprestados = porDisponibilidade.find((d: any) => d.nome === 'EMPRESTIMO')?._count?.equipamentos ?? 0;

    // Por Batalhão — Filtrar TOP 15 para não ficar ilegível
    const dadosBatalhao = batalhoes.map((b: any) => ({
      sigla: b.sigla,
      total: b.secoes.reduce((acc: number, s: any) => acc + s._count.equipamentos, 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

    const statsBatalhao = {
      labels: dadosBatalhao.map(d => d.sigla),
      datasets: [
        {
          label: 'Equipamentos',
          data: dadosBatalhao.map(d => d.total),
          backgroundColor: [
            '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
            '#ef4444', '#06b6d4', '#f97316', '#6366f1',
          ],
        },
      ],
    };

    // Por Tipo
    const statsTipo = {
      labels: top10Tipos.map((t: any) => t.nome),
      datasets: [
        {
          label: 'Quantidade',
          data: top10Tipos.map((t: any) => t._count.equipamentos),
          backgroundColor: '#3b82f6',
          borderRadius: 6,
        },
      ],
    };

    // Mapeamento de cores por significado (Peso da situação - Estilo Futurista/Neon)
    const coresStatus: Record<string, string> = {
      ATIVO: '#00c853', // Verde Intenso (Solicitado pelo usuário)
      DISPONÍVEL: '#00e0b0', // Ciano/Verde Neon
      MANUTENÇÃO: '#ff9f00', // Laranja Elétrico
      RESERVA: '#00b0ff', // Azul Vibrante
      DANO: '#ff3d00', // Vermelho Laranja
      INATIVO: '#d50000', // Vermelho Profundo
      EXTRAVIADO: '#455a64', // Blue Grey
      PENDENTE_APROVACAO: '#7c4dff', // Roxo Neon
    };

    const coresDisponibilidade: Record<string, string> = {
      CARGA: '#00e676', // Verde Ácido
      EMPRESTIMO: '#ffab00', // Âmbar Intenso
      BAIXA: '#78909c', // Slate
    };

    const corPadrao = '#cbd5e1';

    // Por Status — Pizza
    const statsStatus = {
      labels: porStatus.map((s: any) => s.nome),
      datasets: [
        {
          data: porStatus.map((s: any) => s._count.equipamentos),
          backgroundColor: porStatus.map((s: any) => coresStatus[s.nome] || corPadrao),
          hoverOffset: 15,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };

    // Por Disponibilidade — Donut
    const statsDisponibilidade = {
      labels: porDisponibilidade.map((d: any) => d.nome),
      datasets: [
        {
          data: porDisponibilidade.map((d: any) => d._count.equipamentos),
          backgroundColor: porDisponibilidade.map((d: any) => coresDisponibilidade[d.nome] || corPadrao),
          hoverOffset: 4,
          borderWidth: 0,
        },
      ],
    };

    // Por Marca — Agregando via modelos
    const dadosMarcas = marcas.map((m: any) => ({
      nome: m.nome,
      total: m.modelos.reduce((acc: number, mod: any) => acc + mod._count.equipamentos, 0)
    }))
    .filter(m => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

    const statsMarca = {
      labels: dadosMarcas.map(d => d.nome),
      datasets: [
        {
          label: 'Equipamentos',
          data: dadosMarcas.map(d => d.total),
          backgroundColor: '#8b5cf6',
          borderRadius: 4,
        },
      ],
    };

    return {
      resumo: {
        total: totalEquipamentos,
        ativos: totalAtivos,
        manutencao: totalManutencao,
        inativos: totalInativos,
        emprestados: totalEmprestados,
      },
      graficos: {
        porStatus: statsStatus,
        porTipo: statsTipo,
        porDisponibilidade: statsDisponibilidade,
        porBatalhao: statsBatalhao,
        porMarca: statsMarca,
      },
    };
  }

  async obterAtividadesRecentes(usuario: any) {
    try {
      const userFull = await this.prisma.usuario.findUnique({
        where: { id: usuario.sub || usuario.id },
        include: { secao: true, batalhao: true, secoesPermitidas: true },
      });

      if (!userFull) throw new Error('Usuário não encontrado');

      const whereLog: any = {};
      const equipamentoWhere: any = {};
      const and: any[] = [];

      if (userFull.perfil !== 'ADMIN_DTEC') {
        const secoesIds = [
          userFull.secaoId,
          ...userFull.secoesPermitidas.map((s: any) => s.secaoId)
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
          if (secoesIds.length > 0) {
            and.push({ secaoId: { in: secoesIds } });
          } else {
            and.push({ secaoId: -1 });
          }
        }
      }

      if (and.length > 0) {
        equipamentoWhere.AND = and;
        
        // Regra do log: Ou é um log do PRÓPRIO usuário (como login/logout),
        // Ou é um log de um equipamento que pertence às seções que ele tem acesso
        whereLog.OR = [
          { usuarioId: userFull.id },
          { equipamento: { is: equipamentoWhere } }
        ];
      }

      return await this.prisma.logOperacao.findMany({
        where: whereLog,
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: { select: { nome: true } },
        },
      });
    } catch {
      return [];
    }
  }
}





