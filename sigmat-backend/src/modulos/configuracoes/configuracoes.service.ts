import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { PerfilUsuario } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTipos() {
    return this.prisma.tipoEquipamento.findMany({ orderBy: { nome: 'asc' } });
  }

  private async findUsuarioCompleto(usuarioId: number) {
    return this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });
  }

  private getSecoesIds(userFull: any) {
    return [userFull.secaoId, ...userFull.secoesPermitidas.map((s: any) => s.secaoId)].filter(Boolean);
  }

  private getUsuarioBatalhaoId(userFull: any) {
    return userFull.batalhaoId || userFull.secao?.batalhaoId;
  }

  private async validarPermissaoSecao(usuario: any, dados: any) {
    const userFull = await this.findUsuarioCompleto(usuario.id);
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const userBatalhaoId = this.getUsuarioBatalhaoId(userFull);
    const userDiretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;

    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      return;
    }

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      if (dados.batalhaoId) {
        const batalhao = await this.prisma.batalhao.findUnique({ where: { id: dados.batalhaoId } });
        if (!batalhao || batalhao.diretoriaId !== userDiretoriaId) {
          throw new ForbiddenException('Só é possível criar ou alterar seção em batalhões da sua diretoria.');
        }
      }

      if (dados.diretoriaId && dados.diretoriaId !== userDiretoriaId) {
        throw new ForbiddenException('Só é possível criar ou alterar seção para a própria diretoria.');
      }

      return;
    }

    if ([PerfilUsuario.COMANDANTE, PerfilUsuario.USUARIO_BATALHAO].includes(userFull.perfil)) {
      if (!userBatalhaoId) {
        throw new ForbiddenException('Usuário sem unidade definida não pode gerenciar seções.');
      }

      if (!dados.batalhaoId || dados.batalhaoId !== userBatalhaoId) {
        throw new ForbiddenException('Você só pode criar ou alterar seções para o seu batalhão.');
      }

      return;
    }

    throw new ForbiddenException('Perfil sem permissão para gerenciar seções.');
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

  async criarTipo(dados: { nome: string }) {
    return this.prisma.tipoEquipamento.create({ data: { nome: dados.nome } });
  }

  async criarMarca(dados: { nome: string }) {
    return this.prisma.marca.create({ data: { nome: dados.nome } });
  }

  async criarModelo(dados: { nome: string; marcaId?: number }) {
    return this.prisma.modelo.create({ data: { nome: dados.nome, marcaId: dados.marcaId } });
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

  async listarSecoes(usuario?: any) {
    if (!usuario) {
      return this.prisma.secao.findMany({
        include: { batalhao: true, diretoria: true, _count: { select: { equipamentos: true } } },
        orderBy: { sigla: 'asc' },
      });
    }

    const userFull = await this.findUsuarioCompleto(usuario.id);
    if (!userFull) return [];

    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      return this.prisma.secao.findMany({
        include: { batalhao: true, diretoria: true },
        orderBy: { sigla: 'asc' },
      });
    }

    const secoesIds = this.getSecoesIds(userFull);
    const userBatalhaoId = this.getUsuarioBatalhaoId(userFull);
    const userDiretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
    const where: any = { OR: [] };

    if (secoesIds.length > 0) {
      where.OR.push({ id: { in: secoesIds } });
    }

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      if (userDiretoriaId) {
        where.OR.push({ diretoriaId: userDiretoriaId });
        where.OR.push({ batalhao: { diretoriaId: userDiretoriaId } });
      }
    } else {
      if (userBatalhaoId) {
        where.OR.push({ batalhaoId: userBatalhaoId });
      }
    }

    if (where.OR.length === 0) {
      return [];
    }

    return this.prisma.secao.findMany({
      where,
      include: { batalhao: true, diretoria: true, _count: { select: { equipamentos: true } } },
      orderBy: { sigla: 'asc' },
    });
  }

  async criarSecao(dados: { sigla: string; nome: string; batalhaoId?: number; diretoriaId?: number }, usuario: any) {
    await this.validarPermissaoSecao(usuario, dados);
    return this.prisma.secao.create({ data: dados });
  }

  async atualizarSecao(id: number, dados: { sigla?: string; nome?: string; batalhaoId?: number; diretoriaId?: number }, usuario: any) {
    await this.validarPermissaoSecao(usuario, dados);
    const secao = await this.prisma.secao.findUnique({ where: { id } });
    if (!secao) throw new NotFoundException('Seção não encontrada.');
    return this.prisma.secao.update({ where: { id }, data: dados });
  }

  async listarBatalhoes() {
    return this.prisma.batalhao.findMany({
      orderBy: { sigla: 'asc' },
    });
  }
}





