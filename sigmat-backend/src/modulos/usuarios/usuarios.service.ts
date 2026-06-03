/**
 * [Estado Atual]: Camada de serviço de negócios para a entidade Usuario.
 * [Dependências Técnicas]:
 *   - UsersRepository
 * [Histórico de Modificações]:
 *   - Refatorado para utilizar o padrão Repository/Service, desacoplando o PrismaService.
 *   - Injetados os cabeçalhos de contexto arquitetural.
 * [Regras de Negócio Imutáveis]:
 *   - Garantir que logins de usuários sejam únicos.
 *   - Atualizações e deleções dependem da pré-existência do ID buscado.
 */

import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersRepository } from './usuarios.repository';
import { PerfilUsuario } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async listarTodos(usuario: any) {
    const userFull = await this.repository.findUnique({
      where: { id: usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull) throw new NotFoundException('Usuário autenticado não encontrado');

    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      return this.repository.findMany({
        include: {
          secao: { include: { batalhao: true } },
          batalhao: true,
        },
        orderBy: { nome: 'asc' },
      });
    }

    const where = this.buildVisibilityWhere(userFull);
    return this.repository.findMany({
      where,
      include: {
        secao: { include: { batalhao: true } },
        batalhao: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorIdAutorizado(id: number, usuario: any) {
    const userFull = await this.repository.findUnique({
      where: { id: usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull) throw new NotFoundException('Usuário autenticado não encontrado');

    const usuarioAlvo = await this.buscarPorId(id);
    if (this.canSeeUsuario(userFull, usuarioAlvo)) {
      return usuarioAlvo;
    }

    throw new ForbiddenException('Você não tem permissão para visualizar este usuário.');
  }

  private canSeeUsuario(userFull: any, usuarioAlvo: any): boolean {
    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      return true;
    }

    const meuDiretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
    const meuBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    const secoesIds = [userFull.secaoId, ...userFull.secoesPermitidas.map((s: any) => s.secaoId)].filter(Boolean);
    const alvoDiretoriaId = usuarioAlvo.secao?.diretoriaId || usuarioAlvo.batalhao?.diretoriaId;
    const alvoBatalhaoId = usuarioAlvo.batalhaoId || usuarioAlvo.secao?.batalhaoId;

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      return (!!meuDiretoriaId && alvoDiretoriaId === meuDiretoriaId) || secoesIds.includes(usuarioAlvo.secaoId);
    }

    return (!!alvoBatalhaoId && !!meuBatalhaoId && alvoBatalhaoId === meuBatalhaoId) || secoesIds.includes(usuarioAlvo.secaoId);
  }

  private buildVisibilityWhere(userFull: any): any {
    const secoesIds = [userFull.secaoId, ...userFull.secoesPermitidas.map((s: any) => s.secaoId)].filter(Boolean);

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
      const or: any[] = [];

      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      if (diretoriaId) {
        or.push({ secao: { diretoriaId } });
        or.push({ batalhao: { diretoriaId } });
      }

      return or.length > 0 ? { OR: or } : { secaoId: -1 };
    }

    const batalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    const or: any[] = [];
    if (secoesIds.length > 0) or.push({ secaoId: { in: secoesIds } });
    if (batalhaoId) or.push({ batalhaoId });

    return or.length > 0 ? { OR: or } : { secaoId: -1 };
  }

  async buscarPorId(id: number) {
    const usuario = await this.repository.findUnique({
      where: { id },
      include: {
        secao: { include: { batalhao: true, diretoria: true } },
        batalhao: { include: { diretoria: true } },
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
    return this.repository.findUnique({
      where: { login },
      include: { secao: true, batalhao: true },
    });
  }

  async buscarPorLoginAutorizado(login: string, usuario: any) {
    const userFull = await this.repository.findUnique({
      where: { id: usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull) throw new NotFoundException('Usuário autenticado não encontrado');

    const usuarioAlvo = await this.buscarPorLogin(login);
    if (!usuarioAlvo) throw new NotFoundException(`Usuário com login ${login} não encontrado`);

    if (this.canSeeUsuario(userFull, usuarioAlvo)) {
      return usuarioAlvo;
    }

    throw new ForbiddenException('Você não tem permissão para visualizar este usuário.');
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
    const existe = await this.repository.findUnique({ where: { login: dados.login } });
    if (existe) throw new ConflictException(`Login ${dados.login} já cadastrado`);

    return this.repository.create({
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
    return this.repository.update({
      where: { id },
      data: dados,
      include: { secao: true, batalhao: true },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    return this.repository.delete({ where: { id } });
  }

  async upsertUsuarioCorporativo(dadosUsuario: any) {
    let secaoId = null;
    let batalhaoId = null;
    let diretoriaId = null;

    const organizacaoDisp = String(dadosUsuario.organizacaoDisp || '').trim().toUpperCase();
    const secaoSigla = String(dadosUsuario.secaoSigla || '').trim().toUpperCase();
    const perfil = dadosUsuario.perfil || PerfilUsuario.USUARIO_BATALHAO;

    if (perfil === PerfilUsuario.DIRETORIA && organizacaoDisp) {
      let diretoria = await this.repository.findDiretoriaFirst({ where: { sigla: organizacaoDisp } });
      if (!diretoria) {
        diretoria = await this.repository.createDiretoria({
          data: { sigla: organizacaoDisp, nome: organizacaoDisp }
        });
      }
      diretoriaId = diretoria.id;
    }

    if ((perfil === PerfilUsuario.COMANDANTE || perfil === PerfilUsuario.USUARIO_BATALHAO) && organizacaoDisp) {
      let batalhao = await this.repository.findBatalhaoFirst({ where: { sigla: organizacaoDisp } });
      if (!batalhao) {
        batalhao = await this.repository.createBatalhao({
          data: { sigla: organizacaoDisp, nome: organizacaoDisp, ...(diretoriaId ? { diretoriaId } : {}) }
        });
      }
      batalhaoId = batalhao.id;
    }

    if (secaoSigla) {
      let secao = await this.repository.findSecaoFirst({ where: { sigla: secaoSigla } });
      if (!secao) {
        secao = await this.repository.createSecao({
          data: {
            sigla: secaoSigla,
            nome: secaoSigla,
            ...(diretoriaId ? { diretoriaId } : {}),
            ...(batalhaoId ? { batalhaoId } : {})
          }
        });
      }

      secaoId = secao.id;
      if (!batalhaoId && secao.batalhaoId) batalhaoId = secao.batalhaoId;
      if (!diretoriaId && secao.diretoriaId) diretoriaId = secao.diretoriaId;
    }

    return this.repository.upsert({
      where: { login: dadosUsuario.login || dadosUsuario.matricula },
      update: {
        nome: dadosUsuario.nome,
        email: dadosUsuario.email,
        postoGraduacao: dadosUsuario.postoGraduacao,
        matricula: dadosUsuario.matricula || '',
        ...(secaoId ? { secaoId } : {}),
        ...(batalhaoId ? { batalhaoId } : {}),
        ...(perfil ? { perfil } : {}),
      },
      create: {
        login: dadosUsuario.login || dadosUsuario.matricula,
        matricula: dadosUsuario.matricula || '',
        nome: dadosUsuario.nome,
        email: dadosUsuario.email,
        postoGraduacao: dadosUsuario.postoGraduacao,
        perfil,
        ...(secaoId ? { secaoId } : {}),
        ...(batalhaoId ? { batalhaoId } : {}),
      },
    });
  }
}
