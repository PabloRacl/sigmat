/**
 * [Estado Atual]: Serviço de negócios principal para gestão do ciclo de vida de Equipamentos.
 * [Dependências Técnicas]: Consome EquipmentRepository, ApprovalsService, AuditService.
 * [Histórico de Modificações]: Isolamento do Prisma no EquipmentRepository; Atualização de lógica de auditoria (gerarDiffComLabels).
 * [Regras de Negócio Imutáveis]: Validações rigorosas de permissão por PerfilUsuario para criação/edição.
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EquipmentRepository } from './materiais.repository';
import { CriarEquipamentoDto } from './dto/criar-equipamento.dto';
import { AtualizarEquipamentoDto } from './dto/atualizar-equipamento.dto';
import { ApprovalsService } from '../aprovacoes/aprovacoes.service';
import { PerfilUsuario, AcaoLog } from '@prisma/client';

import { AuditService } from '../../compartilhado/servicos/audit.service';
import { EquipamentoFiltroBuilder } from './comum/equipamento-filtro.builder';
import { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';
import { AtualizarMassaDto } from './dto/atualizar-massa.dto';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    private readonly repository: EquipmentRepository,
    private readonly approvalsService: ApprovalsService,
    private readonly auditService: AuditService,
  ) {}

  async listarTodos(
    usuario: UsuarioLogado,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      tipoId?: number;
      statusId?: number;
      disponibilidadeId?: number;
      secaoId?: number;
      marcaId?: number;
      patrimonio?: string;
      sei?: string;
      numeroSerie?: string;
      dataAquisicao?: string;
      observacao?: string;
    },
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;
    const search = params.search?.trim();

    const userFull = await this.repository.findUsuarioCompleto(usuario.id);

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const where = new EquipamentoFiltroBuilder(userFull)
      .aplicarPermissoes()
      .aplicarBuscaGeral(search)
      .aplicarFiltrosAvancados(params)
      .build();

    this.logger.log(`Listando equipamentos para usuário: ${userFull.login}`);

    const [total, itens] = await Promise.all([
      this.repository.countEquipamentos(where),
      this.repository.findEquipamentos(where, skip, limit),
    ]);

    return {
      itens,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async buscarPorId(id: number) {
    const equipamento = await this.repository.findEquipamentoById(id);

    if (!equipamento) {
      throw new NotFoundException(`Equipamento com ID ${id} não encontrado`);
    }

    return equipamento;
  }

  async criar(dados: CriarEquipamentoDto, usuario: UsuarioLogado) {
    this.logger.log(`Iniciando criação de equipamento: ${dados.patrimonio}`);

    const userFull = await this.repository.findUsuarioCompleto(usuario.id);

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException(
        'Usuários de Diretoria não podem cadastrar equipamentos.',
      );
    }

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      const secao = await this.repository.findSecaoById(dados.secaoId);
      if (!secao)
        throw new NotFoundException('Seção de destino não encontrada.');

      const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
      if (!userBatalhaoId || secao.batalhaoId !== userBatalhaoId) {
        throw new ForbiddenException(
          'Você só pode cadastrar equipamentos para sua unidade.',
        );
      }
    }

    try {
      const {
        dataAquisicao,
        dataSolicitacao,
        dataRetornoEmprestimo,
        ...outrosDados
      } = dados;

      if (!outrosDados.batalhaoId) {
        const secao = await this.repository.findSecaoById(dados.secaoId);
        if (secao?.batalhaoId) outrosDados.batalhaoId = secao.batalhaoId;
      }

      const novoEquipamento = await this.repository.createEquipamento({
        ...outrosDados,
        dataAquisicao: dataAquisicao ? new Date(dataAquisicao) : null,
        dataSolicitacao: dataSolicitacao ? new Date(dataSolicitacao) : null,
        dataRetornoEmprestimo: dataRetornoEmprestimo
          ? new Date(dataRetornoEmprestimo)
          : null,
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

  async atualizar(id: number, dados: AtualizarEquipamentoDto, usuario: UsuarioLogado) {
    const equipamentoAtual = await this.buscarPorId(id);
    const userId = usuario.id;

    const userFull = await this.repository.findUsuarioCompleto(userId);
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (dados.statusId && dados.statusId !== equipamentoAtual.statusId) {
      const statusManutencao = await this.repository.findStatusEquipamentoByNome('Manutenção');
      if (statusManutencao && dados.statusId === statusManutencao.id) {
        throw new ForbiddenException('Para colocar o equipamento em manutenção, abra uma Ordem de Serviço formal pelo painel de Manutenção.');
      }
    }

    if (usuario.perfil === PerfilUsuario.ADMIN_DTEC) {
      return this.aplicarAtualizacaoDireta(
        id,
        dados,
        userId,
        equipamentoAtual,
        'ADMIN',
      );
    }

    if (usuario.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException(
        'Usuários de Diretoria não podem modificar equipamentos.',
      );
    }

    const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    if (
      !userBatalhaoId ||
      equipamentoAtual.secao?.batalhaoId !== userBatalhaoId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar equipamentos de outra unidade.',
      );
    }

    if (usuario.perfil === PerfilUsuario.COMANDANTE) {
      return this.aplicarAtualizacaoDireta(
        id,
        dados,
        userId,
        equipamentoAtual,
        'COMANDANTE',
      );
    }

    return this.approvalsService.criarSolicitacao(
      id,
      userId,
      dados,
      equipamentoAtual,
    );
  }

  private async aplicarAtualizacaoDireta(
    id: number,
    dados: AtualizarEquipamentoDto,
    userId: number,
    atual: Record<string, any>,
    perfilLabel: string,
  ) {
    const {
      dataAquisicao,
      dataSolicitacao,
      dataRetornoEmprestimo,
      ...outrosDados
    } = dados;

    try {
      await this.repository.updateEquipamento(id, {
        ...outrosDados,
        dataAquisicao: dataAquisicao ? new Date(dataAquisicao) : undefined,
        dataSolicitacao: dataSolicitacao ? new Date(dataSolicitacao) : undefined,
        dataRetornoEmprestimo: dataRetornoEmprestimo
          ? new Date(dataRetornoEmprestimo)
          : undefined,
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
    } catch (error) {
      this.logger.error(`Erro ao atualizar equipamento: ${error.message}`);
      throw error;
    }
  }

  async remover(id: number, usuario: UsuarioLogado) {
    const equipamento = await this.buscarPorId(id);

    if (usuario.perfil !== PerfilUsuario.ADMIN_DTEC) {
      return this.approvalsService.criarSolicitacao(
        id,
        usuario.id,
        { _acao: 'DELETE' },
        equipamento,
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

  async atualizarEmMassa(ids: number[], dados: AtualizarMassaDto['dados'], usuario: UsuarioLogado) {
    if (!ids || ids.length === 0) return;

    const userFull = await this.repository.findUsuarioCompleto(usuario.id);

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const {
      statusId,
      secaoId,
      disponibilidadeId,
      tipoAquisicaoId,
      observacao,
    } = dados;

    if (statusId) {
      const statusManutencao = await this.repository.findStatusEquipamentoByNome('Manutenção');
      if (statusManutencao && statusId === statusManutencao.id) {
        throw new ForbiddenException('Não é permitido alterar para Manutenção em massa. Abra Ordens de Serviço formalmente.');
      }
    }

    const updateData: Record<string, any> = {};
    if (statusId) updateData.statusId = statusId;
    if (secaoId) updateData.secaoId = secaoId;
    if (disponibilidadeId) updateData.disponibilidadeId = disponibilidadeId;
    if (tipoAquisicaoId) updateData.tipoAquisicaoId = tipoAquisicaoId;
    if (observacao) updateData.observacao = observacao;

    const equipamentos = await this.repository.findEquipamentosByIds(ids);

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      if (
        userFull.perfil === PerfilUsuario.DIRETORIA ||
        userFull.perfil === PerfilUsuario.USUARIO_BATALHAO
      ) {
        throw new ForbiddenException(
          'Somente administradores e comandantes podem efetuar atualizações em massa.',
        );
      }

      const idsInvalidos = equipamentos.filter(
        (e) => e.secao?.batalhaoId !== userFull.batalhaoId,
      );
      if (idsInvalidos.length > 0) {
        throw new ForbiddenException(
          'Você não tem permissão para editar equipamentos de outra unidade em lote.',
        );
      }
    }

    const results = await this.repository.updateManyEquipamentosTransaction(
      equipamentos,
      updateData,
    );

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
