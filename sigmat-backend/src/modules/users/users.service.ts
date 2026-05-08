import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PerfilUsuario } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTodos() {
    return this.prisma.usuario.findMany({
      include: {
        secao: { include: { batalhao: true } },
        batalhao: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        secao: { include: { batalhao: true } },
        batalhao: true,
        equipamentosResponsaveis: {
          select: { id: true, patrimonio: true, tipoEquipamento: true, status: true },
          take: 10,
        },
      },
    });
    if (!usuario) throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    return usuario;
  }

  async buscarPorLogin(login: string) {
    return this.prisma.usuario.findUnique({
      where: { login },
      include: { secao: true, batalhao: true },
    });
  }

  async criar(dados: {
    login: string;
    matricula: string;
    nome: string;
    email?: string;
    postoGraduacao?: string;
    perfil: PerfilUsuario;
    secaoId?: number;
    batalhaoId?: number;
  }) {
    const existe = await this.prisma.usuario.findUnique({ where: { login: dados.login } });
    if (existe) throw new ConflictException(`Login ${dados.login} já cadastrado`);

    return this.prisma.usuario.create({
      data: {
        login: dados.login,
        matricula: dados.matricula,
        nome: dados.nome,
        email: dados.email,
        postoGraduacao: dados.postoGraduacao,
        perfil: dados.perfil,
        secaoId: dados.secaoId,
        batalhaoId: dados.batalhaoId,
      },
      include: { secao: true, batalhao: true },
    });
  }

  async atualizar(id: number, dados: Partial<{
    login: string;
    matricula: string;
    nome: string;
    email: string;
    postoGraduacao: string;
    perfil: PerfilUsuario;
    secaoId: number;
    batalhaoId: number;
  }>) {
    await this.buscarPorId(id);
    return this.prisma.usuario.update({
      where: { id },
      data: dados,
      include: { secao: true, batalhao: true },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    return this.prisma.usuario.delete({ where: { id } });
  }

  async upsertDoSei(dadosSei: any) {
    let secaoId = null;

    if (dadosSei.unidade) {
      let secao = await this.prisma.secao.findFirst({
        where: { sigla: dadosSei.unidade }
      });
      if (!secao) {
        secao = await this.prisma.secao.create({
          data: { sigla: dadosSei.unidade, nome: dadosSei.unidade }
        });
      }
      secaoId = secao.id;
    }

    return this.prisma.usuario.upsert({
      where: { login: dadosSei.login || dadosSei.matricula },
      update: {
        nome: dadosSei.nome,
        email: dadosSei.email,
        postoGraduacao: dadosSei.postoGraduacao,
        matricula: dadosSei.matricula || '',
        ...(secaoId && { secaoId }),
        ...(dadosSei.perfil && { perfil: dadosSei.perfil })
      },
      create: {
        login: dadosSei.login || dadosSei.matricula,
        matricula: dadosSei.matricula || '',
        nome: dadosSei.nome,
        email: dadosSei.email,
        postoGraduacao: dadosSei.postoGraduacao,
        perfil: dadosSei.perfil || PerfilUsuario.USUARIO_BATALHAO,
        secaoId: secaoId
      },
    });
  }
}





