import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CriarEquipamentoDto } from './dto/criar-equipamento.dto';
import { AtualizarEquipamentoDto } from './dto/atualizar-equipamento.dto';
import { ApprovalsService } from '../approvals/approvals.service';
import { PerfilUsuario, AcaoLog } from '@prisma/client';

import { AuditService } from '../../shared/services/audit.service';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalsService: ApprovalsService,
    private readonly auditService: AuditService,
  ) {}

  async listarTodos(usuario: any, params: { 
    page?: number, 
    limit?: number, 
    search?: string,
    tipoId?: number,
    statusId?: number,
    disponibilidadeId?: number,
    secaoId?: number
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;
    const search = params.search?.trim();

    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const where: any = {};
    const and: any[] = [];

    // 1. Controle de Acesso por Perfil e Novas Permissões Multilocais
    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      // Vê tudo
    } else {
      // Pega todos os IDs de seções que o usuário tem acesso
      const secoesIds = [
        userFull.secaoId,
        ...userFull.secoesPermitidas.map(s => s.secaoId)
      ].filter(Boolean);

      if (userFull.perfil === PerfilUsuario.DIRETORIA) {
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
          // Se não tem seção, não vê nada
          and.push({ secaoId: -1 });
        }
      }
    }

    // 2. Filtro de Busca (Patrimônio, Série, SEI, Tipo, Marca, Seção)
    if (search) {
      and.push({
        OR: [
          { patrimonio: { contains: search, mode: 'insensitive' } },
          { numeroSerie: { contains: search, mode: 'insensitive' } },
          { sei: { contains: search, mode: 'insensitive' } },
          { tipoEquipamento: { nome: { contains: search, mode: 'insensitive' } } },
          { marca: { nome: { contains: search, mode: 'insensitive' } } },
          { secao: { sigla: { contains: search, mode: 'insensitive' } } },
          { observacao: { contains: search, mode: 'insensitive' } },
          { solicitante: { contains: search, mode: 'insensitive' } },
          { especificacoes: { path: [], string_contains: search } },
        ]
      });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    if (params.tipoId) where.tipoEquipamentoId = Number(params.tipoId);
    if (params.statusId) where.statusId = Number(params.statusId);
    if (params.disponibilidadeId) where.disponibilidadeId = Number(params.disponibilidadeId);
    
    // Se o filtro avançado de seção for preenchido, ele deve respeitar a permissão do usuário
    // Se where.AND já tiver uma regra de seção, adicionamos um AND para restringir à seção filtrada
    if (params.secaoId) {
      if (!where.AND) where.AND = [];
      where.AND.push({ secaoId: Number(params.secaoId) });
    }

    this.logger.log(`Listando equipamentos para usuário: ${userFull.login}`);

    const [total, itens] = await Promise.all([
      this.prisma.equipamento.count({ where }),
      this.prisma.equipamento.findMany({
        where,
        include: {
          tipoEquipamento: true,
          status: true,
          secao: { include: { batalhao: true, diretoria: true } },
          marca: true,
          modelo: true,
          tipoAquisicao: true,
          disponibilidade: true,
        },
        orderBy: { patrimonio: 'asc' },
        skip,
        take: limit,
      })
    ]);

    return {
      itens,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async buscarPorId(id: number) {
    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id },
      include: {
        tipoEquipamento: true,
        status: true,
        secao: { include: { batalhao: true, diretoria: true } },
        marca: true,
        modelo: true,
        tipoAquisicao: true,
        disponibilidade: true,
      },
    });

    if (!equipamento) {
      throw new NotFoundException(`Equipamento com ID ${id} não encontrado`);
    }

    return equipamento;
  }

  async criar(dados: CriarEquipamentoDto, usuario: any) {
    this.logger.log(`Iniciando criação de equipamento: ${dados.patrimonio}`);
    
    // Apenas ADMIN ou usuários da SEÇÃO do equipamento podem criar
    // (Ou simplificando: usuários criam para sua própria seção)
    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.id }
    });

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC && userFull.secaoId !== dados.secaoId) {
      throw new ForbiddenException('Você só pode cadastrar equipamentos para sua própria seção.');
    }

    try {
      const { dataAquisicao, dataSolicitacao, dataRetornoEmprestimo, ...outrosDados } = dados;

      const novoEquipamento = await this.prisma.equipamento.create({
        data: {
          ...outrosDados,
          dataAquisicao: dataAquisicao ? new Date(dataAquisicao) : null,
          dataSolicitacao: dataSolicitacao ? new Date(dataSolicitacao) : null,
          dataRetornoEmprestimo: dataRetornoEmprestimo ? new Date(dataRetornoEmprestimo) : null,
        },
      });

      await this.auditService.registrarLog({
        usuarioId: userFull.id,
        equipamentoId: novoEquipamento.id,
        acao: AcaoLog.CREATE,
        descricao: `Equipamento ${novoEquipamento.patrimonio} cadastrado.`,
        dadosAlterados: dados,
      });

      return novoEquipamento;
    } catch (error) {
      this.logger.error(`Erro ao criar equipamento: ${error.message}`);
      throw error;
    }
  }

  async atualizar(id: number, dados: AtualizarEquipamentoDto, usuario: any) {
    const equipamentoAtual = await this.buscarPorId(id);
    const userId = usuario.id;

    // 1. Regra de Edição por Perfil
    if (usuario.perfil === PerfilUsuario.ADMIN_DTEC) {
      // ADMIN: Edita tudo direto
      return this.aplicarAtualizacaoDireta(id, dados, userId, equipamentoAtual, 'ADMIN');
    }

    if (usuario.perfil === PerfilUsuario.DIRETORIA) {
      // DIRETORIA: Só edita se for da sua própria SEÇÃO
      const userFull = await this.prisma.usuario.findUnique({ where: { id: userId } });
      if (!userFull) throw new NotFoundException('Usuário não encontrado');

      if (equipamentoAtual.secaoId === userFull.secaoId) {
        return this.aplicarAtualizacaoDireta(id, dados, userId, equipamentoAtual, 'DIRETORIA');
      } else {
        throw new ForbiddenException('Usuários de Diretoria podem visualizar batalhões, mas só editam equipamentos de sua própria seção.');
      }
    }

    // 2. COMANDANTE e USUARIO_BATALHAO
    // Só podem editar se for do seu batalhão
    const userFull = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (equipamentoAtual.secao?.batalhaoId !== userFull.batalhaoId) {
      throw new ForbiddenException('Você não tem permissão para editar equipamentos de outra unidade.');
    }

    // Se for do batalhão, entra no fluxo de aprovação
    return this.approvalsService.criarSolicitacao(
      id,
      userId,
      dados,
      equipamentoAtual
    );
  }

  private async aplicarAtualizacaoDireta(id: number, dados: any, userId: number, atual: any, perfilLabel: string) {
    const { dataAquisicao, dataSolicitacao, dataRetornoEmprestimo, id: _id, ...outrosDados } = dados;

    const atualizado = await this.prisma.equipamento.update({
      where: { id },
      data: {
        ...outrosDados,
        dataAquisicao: dataAquisicao ? new Date(dataAquisicao) : undefined,
        dataSolicitacao: dataSolicitacao ? new Date(dataSolicitacao) : undefined,
        dataRetornoEmprestimo: dataRetornoEmprestimo ? new Date(dataRetornoEmprestimo) : undefined,
      },
    });

    const diff = this.auditService.gerarDiff(atual, atualizado);
    if (diff) {
      await this.auditService.registrarLog({
        usuarioId: userId,
        equipamentoId: id,
        acao: AcaoLog.UPDATE,
        descricao: `Equipamento ${atual.patrimonio} atualizado diretamente por ${perfilLabel}.`,
        dadosAlterados: diff,
      });
    }
    return atualizado;
  }

  async remover(id: number, usuario: any) {
    const equipamento = await this.buscarPorId(id);

    if (usuario.perfil !== PerfilUsuario.ADMIN_DTEC) {
      // Se não for admin, envia para aprovação
      return this.approvalsService.criarSolicitacao(
        id, 
        usuario.id, 
        { _acao: 'DELETE' }, 
        equipamento
      );
    }

    await this.auditService.registrarLog({
      usuarioId: usuario.id,
      equipamentoId: id,
      acao: AcaoLog.DELETE,
      descricao: `Equipamento ${equipamento.patrimonio} excluído do sistema.`,
      dadosAlterados: { patrimonio: equipamento.patrimonio },
    });

    return this.prisma.equipamento.delete({
      where: { id },
    });
  }

  async obterHistorico(id: number) {
    return this.prisma.logOperacao.findMany({
      where: { equipamentoId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: {
          select: { nome: true, matricula: true, postoGraduacao: true }
        }
      }
    });
  }

  async atualizarEmMassa(ids: number[], dados: any, usuario: any) {
    if (!ids || ids.length === 0) return;

    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.id }
    });

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    // Filtra campos permitidos para atualização em massa para segurança
    const { statusId, secaoId, disponibilidadeId, tipoAquisicaoId, observacao } = dados;
    const updateData: any = {};
    if (statusId) updateData.statusId = statusId;
    if (secaoId) updateData.secaoId = secaoId;
    if (disponibilidadeId) updateData.disponibilidadeId = disponibilidadeId;
    if (tipoAquisicaoId) updateData.tipoAquisicaoId = tipoAquisicaoId;
    if (observacao) updateData.observacao = observacao;

    // 1. Verifica se o usuário tem permissão sobre TODOS os IDs
    const equipamentos = await this.prisma.equipamento.findMany({
      where: { id: { in: ids } },
      include: { secao: true }
    });

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      const idsInvalidos = equipamentos.filter(e => e.secao?.batalhaoId !== userFull.batalhaoId);
      if (idsInvalidos.length > 0) {
        throw new ForbiddenException('Você não tem permissão para editar equipamentos de outra unidade em lote.');
      }
    }

    // 2. Executa a atualização e registra logs
    const results = await this.prisma.$transaction(
      equipamentos.map(eq => {
        return this.prisma.equipamento.update({
          where: { id: eq.id },
          data: updateData
        });
      })
    );

    // 3. Registra logs de auditoria
    for (const eq of equipamentos) {
      await this.auditService.registrarLog({
        usuarioId: userFull.id,
        equipamentoId: eq.id,
        acao: AcaoLog.BATCH_UPDATE,
        descricao: `Atualização em massa aplicada ao equipamento ${eq.patrimonio}.`,
        dadosAlterados: updateData,
      });
    }

    return results;
  }
}





