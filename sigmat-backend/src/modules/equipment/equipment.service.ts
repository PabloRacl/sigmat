/**
 * [Estado Atual]: Serviço de negócios principal para gestão do ciclo de vida de Equipamentos.
 * [Dependências Técnicas]: Consome EquipmentRepository, ApprovalsService, AuditService.
 * [Histórico de Modificações]: Isolamento do Prisma no EquipmentRepository; Atualização de lógica de auditoria (gerarDiffComLabels).
 * [Regras de Negócio Imutáveis]: Validações rigorosas de permissão por PerfilUsuario para criação/edição.
 */
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { EquipmentRepository } from './equipment.repository';
import { CriarEquipamentoDto } from './dto/criar-equipamento.dto';
import { AtualizarEquipamentoDto } from './dto/atualizar-equipamento.dto';
import { ApprovalsService } from '../approvals/approvals.service';
import { PerfilUsuario, AcaoLog } from '@prisma/client';

import { AuditService } from '../../shared/services/audit.service';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    private readonly repository: EquipmentRepository,
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
    secaoId?: number,
    marcaId?: number,
    patrimonio?: string,
    sei?: string,
    numeroSerie?: string,
    dataAquisicao?: string,
    observacao?: string
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;
    const search = params.search?.trim();

    const userFull = await this.repository.findUsuarioCompleto(usuario.id);

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const where: any = {};
    const and: any[] = [];

    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      // Vê tudo
    } else {
      const secoesIds = [userFull.secaoId, ...userFull.secoesPermitidas.map(s => s.secaoId)].filter(Boolean);
      const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;

      if (userFull.perfil === PerfilUsuario.DIRETORIA) {
        const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
        const diretoriasOr: any[] = [];

        if (secoesIds.length > 0) {
          diretoriasOr.push({ secaoId: { in: secoesIds } });
        }

        if (diretoriaId) {
          diretoriasOr.push({ secao: { diretoriaId } });
          diretoriasOr.push({ secao: { batalhao: { diretoriaId } } });
        }

        if (diretoriasOr.length === 0) {
          and.push({ secaoId: -1 });
        } else {
          and.push({ OR: diretoriasOr });
        }
      } else if (userBatalhaoId) {
        const or: any[] = [];
        if (secoesIds.length > 0) {
          or.push({ secaoId: { in: secoesIds } });
        }
        // filtrar por batalhão do usuário (direto ou via seção)
        or.push({ secao: { batalhaoId: userBatalhaoId } });
        and.push({ OR: or });
      } else {
        if (secoesIds.length > 0) {
          and.push({ secaoId: { in: secoesIds } });
        } else {
          and.push({ secaoId: -1 });
        }
      }
    }

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

    if (params.tipoId) and.push({ tipoEquipamentoId: Number(params.tipoId) });
    if (params.statusId) and.push({ statusId: Number(params.statusId) });
    if (params.disponibilidadeId) and.push({ disponibilidadeId: Number(params.disponibilidadeId) });
    if (params.secaoId) and.push({ secaoId: Number(params.secaoId) });
    if (params.marcaId) and.push({ marcaId: Number(params.marcaId) });

    if (params.patrimonio) and.push({ patrimonio: { contains: params.patrimonio, mode: 'insensitive' } });
    if (params.sei) and.push({ sei: { contains: params.sei, mode: 'insensitive' } });
    if (params.numeroSerie) and.push({ numeroSerie: { contains: params.numeroSerie, mode: 'insensitive' } });
    if (params.observacao) and.push({ observacao: { contains: params.observacao, mode: 'insensitive' } });
    
    if (params.dataAquisicao) {
      const data = new Date(params.dataAquisicao);
      if (!isNaN(data.getTime())) {
        const startOfDay = new Date(data.setHours(0, 0, 0, 0));
        const endOfDay = new Date(data.setHours(23, 59, 59, 999));
        and.push({ dataAquisicao: { gte: startOfDay, lte: endOfDay } });
      }
    }

    if (and.length > 0) {
      where.AND = and;
    }

    this.logger.log(`Listando equipamentos para usuário: ${userFull.login}`);

    const [total, itens] = await Promise.all([
      this.repository.countEquipamentos(where),
      this.repository.findEquipamentos(where, skip, limit)
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
    const equipamento = await this.repository.findEquipamentoById(id);

    if (!equipamento) {
      throw new NotFoundException(`Equipamento com ID ${id} não encontrado`);
    }

    return equipamento;
  }

  async criar(dados: CriarEquipamentoDto, usuario: any) {
    this.logger.log(`Iniciando criação de equipamento: ${dados.patrimonio}`);
    
    const userFull = await this.repository.findUsuarioCompleto(usuario.id);

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException('Usuários de Diretoria não podem cadastrar equipamentos.');
    }

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      const secao = await this.repository.findSecaoById(dados.secaoId);
      if (!secao) throw new NotFoundException('Seção de destino não encontrada.');

      const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
      if (!userBatalhaoId || secao.batalhaoId !== userBatalhaoId) {
        throw new ForbiddenException('Você só pode cadastrar equipamentos para sua unidade.');
      }
    }

    try {
      const { dataAquisicao, dataSolicitacao, dataRetornoEmprestimo, ...outrosDados } = dados;

      const novoEquipamento = await this.repository.createEquipamento({
        ...outrosDados,
        dataAquisicao: dataAquisicao ? new Date(dataAquisicao) : null,
        dataSolicitacao: dataSolicitacao ? new Date(dataSolicitacao) : null,
        dataRetornoEmprestimo: dataRetornoEmprestimo ? new Date(dataRetornoEmprestimo) : null,
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

    const userFull = await this.repository.findUsuarioCompleto(userId);
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (usuario.perfil === PerfilUsuario.ADMIN_DTEC) {
      return this.aplicarAtualizacaoDireta(id, dados, userId, equipamentoAtual, 'ADMIN');
    }

    if (usuario.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException('Usuários de Diretoria não podem modificar equipamentos.');
    }

    const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    if (!userBatalhaoId || equipamentoAtual.secao?.batalhaoId !== userBatalhaoId) {
      throw new ForbiddenException('Você não tem permissão para alterar equipamentos de outra unidade.');
    }

    if (usuario.perfil === PerfilUsuario.COMANDANTE) {
      return this.aplicarAtualizacaoDireta(id, dados, userId, equipamentoAtual, 'COMANDANTE');
    }

    return this.approvalsService.criarSolicitacao(
      id,
      userId,
      dados,
      equipamentoAtual
    );
  }

  private async aplicarAtualizacaoDireta(id: number, dados: any, userId: number, atual: any, perfilLabel: string) {
    const { dataAquisicao, dataSolicitacao, dataRetornoEmprestimo, id: _id, ...outrosDados } = dados;

    await this.repository.updateEquipamento(id, {
      ...outrosDados,
      dataAquisicao: dataAquisicao ? new Date(dataAquisicao) : undefined,
      dataSolicitacao: dataSolicitacao ? new Date(dataSolicitacao) : undefined,
      dataRetornoEmprestimo: dataRetornoEmprestimo ? new Date(dataRetornoEmprestimo) : undefined,
    });

    const atualizado = await this.buscarPorId(id);
    const diff = await this.auditService.gerarDiffComLabels(atual, atualizado);
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

    return this.repository.deleteEquipamento(id);
  }

  async obterHistorico(id: number) {
    return this.repository.findLogsByEquipamento(id);
  }

  async atualizarEmMassa(ids: number[], dados: any, usuario: any) {
    if (!ids || ids.length === 0) return;

    const userFull = await this.repository.findUsuarioCompleto(usuario.id);

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const { statusId, secaoId, disponibilidadeId, tipoAquisicaoId, observacao } = dados;
    const updateData: any = {};
    if (statusId) updateData.statusId = statusId;
    if (secaoId) updateData.secaoId = secaoId;
    if (disponibilidadeId) updateData.disponibilidadeId = disponibilidadeId;
    if (tipoAquisicaoId) updateData.tipoAquisicaoId = tipoAquisicaoId;
    if (observacao) updateData.observacao = observacao;

    const equipamentos = await this.repository.findEquipamentosByIds(ids);

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      if (userFull.perfil === PerfilUsuario.DIRETORIA || userFull.perfil === PerfilUsuario.USUARIO_BATALHAO) {
        throw new ForbiddenException('Somente administradores e comandantes podem efetuar atualizações em massa.');
      }

      const idsInvalidos = equipamentos.filter(e => e.secao?.batalhaoId !== userFull.batalhaoId);
      if (idsInvalidos.length > 0) {
        throw new ForbiddenException('Você não tem permissão para editar equipamentos de outra unidade em lote.');
      }
    }

    const results = await this.repository.updateManyEquipamentosTransaction(equipamentos, updateData);

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
