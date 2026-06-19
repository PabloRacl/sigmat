import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    return [
      userFull.secaoId,
      ...userFull.secoesPermitidas.map((s: any) => s.secaoId),
    ].filter(Boolean);
  }

  private getUsuarioBatalhaoId(userFull: any) {
    return userFull.batalhaoId || userFull.secao?.batalhaoId;
  }

  private async validarPermissaoSecao(usuario: any, dados: any) {
    const userFull = await this.findUsuarioCompleto(usuario.id);
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const userBatalhaoId = this.getUsuarioBatalhaoId(userFull);
    const userDiretoriaId =
      userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;

    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      return;
    }

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      if (dados.batalhaoId) {
        const batalhao = await this.prisma.batalhao.findUnique({
          where: { id: dados.batalhaoId },
        });
        if (!batalhao || batalhao.diretoriaId !== userDiretoriaId) {
          throw new ForbiddenException(
            'Só é possível criar ou alterar seção em batalhões da sua diretoria.',
          );
        }
      }

      if (dados.diretoriaId && dados.diretoriaId !== userDiretoriaId) {
        throw new ForbiddenException(
          'Só é possível criar ou alterar seção para a própria diretoria.',
        );
      }

      return;
    }

    if (
      [PerfilUsuario.COMANDANTE, PerfilUsuario.USUARIO_BATALHAO].includes(
        userFull.perfil,
      )
    ) {
      if (!userBatalhaoId) {
        throw new ForbiddenException(
          'Usuário sem unidade definida não pode gerenciar seções.',
        );
      }

      if (!dados.batalhaoId || dados.batalhaoId !== userBatalhaoId) {
        throw new ForbiddenException(
          'Você só pode criar ou alterar seções para o seu batalhão.',
        );
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
    const nomeNormalizado = dados.nome?.trim();
    if (!nomeNormalizado) {
      throw new BadRequestException(
        'O nome do tipo de equipamento não pode ser vazio.',
      );
    }
    const existente = await this.prisma.tipoEquipamento.findFirst({
      where: {
        nome: {
          equals: nomeNormalizado,
          mode: 'insensitive',
        },
      },
    });
    if (existente) {
      throw new ConflictException(
        `O tipo de equipamento "${nomeNormalizado}" já está cadastrado.`,
      );
    }
    return this.prisma.tipoEquipamento.create({
      data: { nome: nomeNormalizado },
    });
  }

  async criarMarca(dados: { nome: string }) {
    const nomeNormalizado = dados.nome?.trim();
    if (!nomeNormalizado) {
      throw new BadRequestException('O nome da marca não pode ser vazio.');
    }
    const existente = await this.prisma.marca.findFirst({
      where: {
        nome: {
          equals: nomeNormalizado,
          mode: 'insensitive',
        },
      },
    });
    if (existente) {
      throw new ConflictException(
        `A marca "${nomeNormalizado}" já está cadastrada.`,
      );
    }
    return this.prisma.marca.create({ data: { nome: nomeNormalizado } });
  }

  async criarModelo(dados: { nome: string; marcaId?: number }) {
    const nomeNormalizado = dados.nome?.trim();
    if (!nomeNormalizado) {
      throw new BadRequestException('O nome do modelo não pode ser vazio.');
    }
    if (!dados.marcaId) {
      throw new BadRequestException(
        'A marca deve ser informada para criar um modelo.',
      );
    }
    const existente = await this.prisma.modelo.findFirst({
      where: {
        nome: {
          equals: nomeNormalizado,
          mode: 'insensitive',
        },
        marcaId: dados.marcaId,
      },
    });
    if (existente) {
      throw new ConflictException(
        `O modelo "${nomeNormalizado}" já está cadastrado para esta marca.`,
      );
    }
    return this.prisma.modelo.create({
      data: { nome: nomeNormalizado, marcaId: dados.marcaId },
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

  async listarSecoes(usuario?: any) {
    if (!usuario) {
      return this.prisma.secao.findMany({
        include: {
          batalhao: true,
          diretoria: true,
          _count: { select: { equipamentos: true } },
        },
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
    const userDiretoriaId =
      userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
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
      include: {
        batalhao: true,
        diretoria: true,
        _count: { select: { equipamentos: true } },
      },
      orderBy: { sigla: 'asc' },
    });
  }

  async criarSecao(
    dados: {
      sigla: string;
      nome: string;
      batalhaoId?: number;
      diretoriaId?: number;
    },
    usuario: any,
  ) {
    await this.validarPermissaoSecao(usuario, dados);
    return this.prisma.secao.create({ data: dados });
  }

  async atualizarSecao(
    id: number,
    dados: {
      sigla?: string;
      nome?: string;
      batalhaoId?: number;
      diretoriaId?: number;
    },
    usuario: any,
  ) {
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

  async excluirTipo(id: number) {
    const equipamentosCount = await this.prisma.equipamento.count({
      where: { tipoEquipamentoId: id },
    });
    if (equipamentosCount > 0) {
      throw new ConflictException(
        `Não é possível excluir este tipo de equipamento porque existem ${equipamentosCount} equipamento(s) vinculados a ele.`,
      );
    }

    await this.prisma.usuarioTipoEquipamento.deleteMany({
      where: { tipoEquipamentoId: id },
    });

    return this.prisma.tipoEquipamento.delete({
      where: { id },
    });
  }

  async excluirMarca(id: number) {
    const modelosCount = await this.prisma.modelo.count({
      where: { marcaId: id },
    });
    if (modelosCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta marca porque existem ${modelosCount} modelo(s) cadastrados para ela. Exclua os modelos primeiro.`,
      );
    }

    const equipamentosCount = await this.prisma.equipamento.count({
      where: { marcaId: id },
    });
    if (equipamentosCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta marca porque existem ${equipamentosCount} equipamento(s) vinculados a ela.`,
      );
    }

    return this.prisma.marca.delete({
      where: { id },
    });
  }

  async excluirModelo(id: number) {
    const equipamentosCount = await this.prisma.equipamento.count({
      where: { modeloId: id },
    });
    if (equipamentosCount > 0) {
      throw new ConflictException(
        `Não é possível excluir este modelo porque existem ${equipamentosCount} equipamento(s) vinculados a ele.`,
      );
    }

    return this.prisma.modelo.delete({
      where: { id },
    });
  }
}
