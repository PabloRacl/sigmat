import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { PerfilUsuario } from '@prisma/client';

/**
 * Serviço responsável por consolidar toda a lógica de permissões e
 * visibilidade de dados da aplicação. Cada método devolve as condições
 * Prisma que podem ser usadas diretamente nas cláusulas `where`.
 */
@Injectable()
export class PermissoesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca o usuário completo com suas relações necessárias.
   */
  private async obterUsuarioCompleto(usuarioId: string | number) {
    return this.prisma.usuario.findUnique({
      where: {
        id: typeof usuarioId === 'string' ? parseInt(usuarioId, 10) : usuarioId,
      },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });
  }

  /**
   * Gera condições de visibilidade para equipamentos (relatórios).
   */
  async construirCondicoesVisibilidadeEquipamento(
    usuario: any,
  ): Promise<any[]> {
    const userFull = await this.obterUsuarioCompleto(usuario.sub || usuario.id);
    if (!userFull) return [];
    // ADMIN tem acesso total
    if (userFull.perfil === 'ADMIN_DTEC') return [];

    const secoesIds = [
      userFull.secaoId,
      ...userFull.secoesPermitidas.map((s) => s.secaoId),
    ].filter(Boolean);
    const batalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    const diretoriaId =
      userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;

    // PERFIL DIRETORIA
    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      const or: any[] = [];
      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      if (diretoriaId) {
        or.push({ secao: { diretoriaId } });
        or.push({ secao: { batalhao: { diretoriaId } } });
      }
      return [{ OR: or }];
    }

    // PERFIL COMANDANTE
    if (userFull.perfil === 'COMANDANTE') {
      const or: any[] = [];
      if (batalhaoId) {
        or.push({ secao: { batalhaoId } });
      }
      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      return [{ OR: or }];
    }

    // PERFIL USUARIO_BATALHAO
    if (userFull.perfil === PerfilUsuario.USUARIO_BATALHAO) {
      const or: any[] = [];
      if (batalhaoId) {
        or.push({ secao: { batalhaoId } });
      }
      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      return [{ OR: or }];
    }

    // PERFIL POLICIAL (Apenas sua própria carga)
    if (userFull.perfil === PerfilUsuario.POLICIAL) {
      return [{ usuarioResponsavelId: userFull.id }];
    }

    // PERFIL PADRÃO (outros que tem batalhão)
    if (batalhaoId) {
      const or: any[] = [];
      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      or.push({ secao: { batalhaoId } });
      return [{ OR: or }];
    }

    // fallback sem batalhão
    if (secoesIds.length > 0) {
      return [{ secaoId: { in: secoesIds } }];
    }
    // caso impossível, garante nenhum registro
    return [{ secaoId: -1 }];
  }

  /**
   * Condições de visibilidade para transferências.
   */
  async construirCondicoesVisibilidadeTransferencia(
    usuario: any,
  ): Promise<any> {
    const userFull = await this.obterUsuarioCompleto(usuario.sub || usuario.id);
    if (!userFull || userFull.perfil === 'ADMIN_DTEC') return {};

    const secoesIds = [
      userFull.secaoId,
      ...userFull.secoesPermitidas.map((s) => s.secaoId),
    ].filter(Boolean);
    const batalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    const diretoriaId =
      userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
    const or: any[] = [];

    // Permissões adicionais (seções permitidas)
    if (secoesIds.length > 0) {
      or.push({ origemId: { in: secoesIds } });
      or.push({ destinoId: { in: secoesIds } });
    }

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      if (diretoriaId) {
        or.push({ origem: { diretoriaId } });
        or.push({ destino: { diretoriaId } });
        or.push({ origem: { batalhao: { diretoriaId } } });
        or.push({ destino: { batalhao: { diretoriaId } } });
      }
    } else if (batalhaoId) {
      or.push({ origem: { batalhaoId } });
      or.push({ destino: { batalhaoId } });
    }

    if (or.length === 0) {
      return { OR: [{ origemId: -1 }] };
    }
    return { OR: or };
  }

  /**
   * Condições de visibilidade para logs de auditoria.
   */
  async construirCondicoesVisibilidadeAuditoria(usuario: any): Promise<any> {
    const userFull = await this.obterUsuarioCompleto(usuario.sub || usuario.id);
    if (!userFull || userFull.perfil === 'ADMIN_DTEC') return {};

    const secoesIds = [
      userFull.secaoId,
      ...userFull.secoesPermitidas.map((s) => s.secaoId),
    ].filter(Boolean);
    const batalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    const diretoriaId =
      userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      const or: any[] = [];
      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      if (diretoriaId) {
        or.push({ secao: { diretoriaId } });
        or.push({ secao: { batalhao: { diretoriaId } } });
      }
      return { equipamento: or.length > 0 ? { OR: or } : { secaoId: -1 } };
    }

    if (userFull.perfil === PerfilUsuario.USUARIO_BATALHAO && batalhaoId) {
      return { equipamento: { secao: { batalhaoId } } };
    }

    if (batalhaoId) {
      const or: any[] = [];
      if (secoesIds.length > 0) {
        or.push({ secaoId: { in: secoesIds } });
      }
      or.push({ secao: { batalhaoId } });
      return { equipamento: { OR: or } };
    }

    // fallback
    return {
      equipamento: { secaoId: { in: secoesIds.length > 0 ? secoesIds : [-1] } },
    };
  }

  /**
   * Verifica se o usuário pode editar um equipamento específico.
   */
  async podeEditarEquipamento(
    usuario: any,
    equipamentoId: number,
  ): Promise<boolean> {
    // Regra simples: ADMIN pode editar tudo, diretoria não edita, demais dependem do perfil.
    const userFull = await this.obterUsuarioCompleto(usuario.sub || usuario.id);
    if (!userFull) return false;
    if (userFull.perfil === 'ADMIN_DTEC') return true;
    // TODO: implementar granularidade futura (ex.: dono da seção)
    return false;
  }

  /**
   * Verifica se o usuário pode aprovar mudanças de um equipamento.
   */
  async podeAprovarEquipamento(
    usuario: any,
    equipamentoId: number,
  ): Promise<boolean> {
    // Exemplo: COMANDANTE aprova equipamentos do seu batalhão
    const userFull = await this.obterUsuarioCompleto(usuario.sub || usuario.id);
    if (!userFull) return false;
    if (userFull.perfil === 'ADMIN_DTEC') return true;
    if (userFull.perfil === 'COMANDANTE') {
      const equipamento = await this.prisma.equipamento.findUnique({
        where: { id: equipamentoId },
        select: { secao: { select: { batalhaoId: true } } },
      });
      return (
        equipamento?.secao?.batalhaoId ===
        (userFull.batalhaoId || userFull.secao?.batalhaoId)
      );
    }
    return false;
  }
}
