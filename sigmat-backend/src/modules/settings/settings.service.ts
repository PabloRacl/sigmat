import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTipos() {
    return this.prisma.tipoEquipamento.findMany({ orderBy: { nome: 'asc' } });
  }

  async listarMarcas() {
    return this.prisma.marca.findMany({ orderBy: { nome: 'asc' } });
  }

  async listarModelos(marcaId?: number) {
    return this.prisma.modelo.findMany({
      where: marcaId ? { marcaId } : {},
      orderBy: { nome: 'asc' },
    });
  }

  async listarStatus() {
    return this.prisma.statusEquipamento.findMany({ orderBy: { nome: 'asc' } });
  }

  async listarDisponibilidades() {
    return this.prisma.disponibilidade.findMany({ orderBy: { nome: 'asc' } });
  }

  async listarTiposAquisicao() {
    return this.prisma.tipoAquisicao.findMany({ orderBy: { nome: 'asc' } });
  }

  async listarSecoes() {
    return this.prisma.secao.findMany({
      include: { batalhao: true },
      orderBy: { sigla: 'asc' },
    });
  }

  async listarBatalhoes() {
    return this.prisma.batalhao.findMany({
      orderBy: { sigla: 'asc' },
    });
  }
}





