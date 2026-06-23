import { PerfilUsuario, Prisma } from '@prisma/client';

export class EquipamentoFiltroBuilder {
  private where: Prisma.EquipamentoWhereInput = {};
  private and: Prisma.EquipamentoWhereInput[] = [];

  constructor(private readonly userFull: Prisma.UsuarioGetPayload<{ include: { secao: true; batalhao: true; secoesPermitidas: true } }>) {}

  aplicarPermissoes() {
    if (this.userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      // Vê tudo
      return this;
    }

    const secoesIds = [
      this.userFull.secaoId,
      ...this.userFull.secoesPermitidas.map((s) => s.secaoId),
    ].filter((id): id is number => id != null);
    const userBatalhaoId =
      this.userFull.batalhaoId || this.userFull.secao?.batalhaoId;

    if (this.userFull.perfil === PerfilUsuario.DIRETORIA) {
      const diretoriaId =
        this.userFull.secao?.diretoriaId || this.userFull.batalhao?.diretoriaId;
      const diretoriasOr: Prisma.EquipamentoWhereInput[] = [];

      if (secoesIds.length > 0) {
        diretoriasOr.push({ secaoId: { in: secoesIds } });
      }

      if (diretoriaId) {
        diretoriasOr.push({ secao: { diretoriaId } });
        diretoriasOr.push({ secao: { batalhao: { diretoriaId } } });
      }

      if (diretoriasOr.length === 0) {
        this.and.push({ secaoId: -1 });
      } else {
        this.and.push({ OR: diretoriasOr });
      }
    } else if (userBatalhaoId) {
      const or: Prisma.EquipamentoWhereInput[] = [];
      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      or.push({ secao: { batalhaoId: userBatalhaoId } });
      this.and.push({ OR: or });
    } else {
      if (secoesIds.length > 0) {
        this.and.push({ secaoId: { in: secoesIds } });
      } else {
        this.and.push({ secaoId: -1 });
      }
    }

    return this;
  }

  aplicarBuscaGeral(search?: string) {
    if (search) {
      this.and.push({
        OR: [
          { patrimonio: { contains: search, mode: 'insensitive' } },
          { numeroSerie: { contains: search, mode: 'insensitive' } },
          { sei: { contains: search, mode: 'insensitive' } },
          {
            tipoEquipamento: {
              nome: { contains: search, mode: 'insensitive' },
            },
          },
          { marca: { nome: { contains: search, mode: 'insensitive' } } },
          { secao: { sigla: { contains: search, mode: 'insensitive' } } },
          { observacao: { contains: search, mode: 'insensitive' } },
          { solicitante: { contains: search, mode: 'insensitive' } },
          { especificacoes: { path: ['$'], string_contains: search } },
        ],
      });
    }
    return this;
  }

  aplicarFiltrosAvancados(params: Record<string, any>) {
    if (params.tipoId)
      this.and.push({ tipoEquipamentoId: Number(params.tipoId) });
    if (params.statusId) this.and.push({ statusId: Number(params.statusId) });
    if (params.disponibilidadeId)
      this.and.push({ disponibilidadeId: Number(params.disponibilidadeId) });
    if (params.diretoriaId) {
      this.and.push({
        OR: [
          { secao: { diretoriaId: Number(params.diretoriaId) } },
          { secao: { batalhao: { diretoriaId: Number(params.diretoriaId) } } },
          { batalhao: { diretoriaId: Number(params.diretoriaId) } }
        ]
      });
    }

    if (params.batalhaoId) {
      this.and.push({
        OR: [
          { secao: { batalhaoId: Number(params.batalhaoId) } },
          { batalhaoId: Number(params.batalhaoId) }
        ]
      });
    }

    if (params.secaoId) this.and.push({ secaoId: Number(params.secaoId) });
    if (params.marcaId) this.and.push({ marcaId: Number(params.marcaId) });

    if (params.patrimonio)
      this.and.push({
        patrimonio: { contains: params.patrimonio, mode: 'insensitive' },
      });
    if (params.sei)
      this.and.push({ sei: { contains: params.sei, mode: 'insensitive' } });
    if (params.numeroSerie)
      this.and.push({
        numeroSerie: { contains: params.numeroSerie, mode: 'insensitive' },
      });
    if (params.observacao)
      this.and.push({
        observacao: { contains: params.observacao, mode: 'insensitive' },
      });

    if (params.dataAquisicao) {
      const data = new Date(params.dataAquisicao);
      if (!isNaN(data.getTime())) {
        const startOfDay = new Date(data.setHours(0, 0, 0, 0));
        const endOfDay = new Date(data.setHours(23, 59, 59, 999));
        this.and.push({ dataAquisicao: { gte: startOfDay, lte: endOfDay } });
      }
    }
    return this;
  }

  build() {
    if (this.and.length > 0) {
      this.where.AND = this.and;
    }
    return this.where;
  }
}
