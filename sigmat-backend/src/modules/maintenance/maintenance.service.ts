/**
 * [Estado Atual]: Serviço de negócios para gestão de Manutenção.
 * [Dependências Técnicas]: Consome MaintenanceRepository e NotificationsService.
 * [Histórico de Modificações]: Isolamento da camada de banco de dados (Repository Pattern).
 * [Regras de Negócio Imutáveis]: Validar permissões detalhadas de visualização por Perfil/Seção.
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaintenanceRepository } from './maintenance.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CriarOrdemServicoDto } from './dto/maintenance.dto';
import { StatusManutencao, AcaoLog, PerfilUsuario } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(
    private repository: MaintenanceRepository,
    private notificationsService: NotificationsService
  ) {}

  async listarTodos(usuario: any) {
    const userFull = await this.repository.findUsuarioCompleto(usuario.id);

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const and: any[] = [];

    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      // Vê tudo, nenhum filtro necessário
    } else {
      const secoesIds = [
        userFull.secaoId,
        ...userFull.secoesPermitidas.map(s => s.secaoId)
      ].filter(Boolean);

      if (userFull.perfil === PerfilUsuario.DIRETORIA) {
        const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
        const or: any[] = [];

        if (secoesIds.length > 0) {
          or.push({ equipamento: { secaoId: { in: secoesIds } } });
        }
        if (diretoriaId) {
          or.push({ equipamento: { secao: { diretoriaId } } });
          or.push({ equipamento: { secao: { batalhao: { diretoriaId } } } });
        }

        and.push(or.length > 0 ? { OR: or } : { equipamento: { secaoId: -1 } });
      } else if (userFull.perfil === PerfilUsuario.COMANDANTE) {
        const batalhaoId = userFull.secao?.batalhaoId || userFull.batalhaoId;
        and.push({
          OR: [
            { equipamento: { secaoId: { in: secoesIds } } },
            { equipamento: { secao: { batalhaoId } } }
          ]
        });
      } else {
        and.push({
          equipamento: { secaoId: { in: secoesIds } }
        });
      }
    }

    const where = and.length > 0 ? { AND: and } : {};
    return this.repository.findOrdensServico(where);
  }

  async buscarPorId(id: number) {
    const os = await this.repository.findOrdemById(id);
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');
    return os;
  }

  async criar(dados: CriarOrdemServicoDto, usuario: any) {
    const { equipamentoId, descricaoProblema, tecnicoResponsavel, dataPrevisao } = dados;

    const equipamento = await this.repository.findEquipamentoById(equipamentoId);
    if (!equipamento) throw new NotFoundException('Equipamento não encontrado');

    const userFull = await this.repository.findUsuarioCompleto(usuario.id);
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException('Usuários de Diretoria não podem abrir ordens de serviço.');
    }

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
      if (!userBatalhaoId || equipamento.secao?.batalhaoId !== userBatalhaoId) {
        throw new ForbiddenException('Você só pode abrir ordens de serviço para equipamentos da sua unidade.');
      }
    }

    const statusManutencao = await this.repository.getStatusManutencao();

    const resultado = await this.repository.transaction(async (tx: any) => {
      const os = await tx.ordemServico.create({
        data: {
          equipamentoId,
          solicitanteId: usuario.id,
          descricaoProblema,
          tecnicoResponsavel,
          dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : null,
          status: StatusManutencao.ABERTA
        }
      });

      if (statusManutencao) {
        await tx.equipamento.update({
          where: { id: equipamentoId },
          data: { statusId: statusManutencao.id }
        });
      }

      await tx.logOperacao.create({
        data: {
          equipamentoId,
          usuarioId: usuario.id,
          acao: AcaoLog.ABERTURA_OS,
          descricao: `Ordem de Serviço #${os.id} aberta. Problema: ${descricaoProblema}`
        }
      });

      return os;
    });

    this.notificationsService.notificarAtualizacaoGlobal();
    return resultado;
  }

  async atualizarStatus(id: number, status: StatusManutencao, dadosAdicionais: any = {}, usuario: any) {
    const os = await this.repository.findOrdemById(id);
    if (!os) throw new NotFoundException('Ordem de Serviço não encontrada');

    const userFull = await this.repository.findUsuarioCompleto(usuario.id);
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      if (userFull.perfil !== PerfilUsuario.COMANDANTE) {
        throw new ForbiddenException('Apenas Comandantes ou Administradores podem atualizar o status de manutenção.');
      }

      const equipamento = await this.repository.findEquipamentoById(os.equipamentoId);
      const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
      if (!userBatalhaoId || equipamento?.secao?.batalhaoId !== userBatalhaoId) {
        throw new ForbiddenException('Você só pode atualizar status para ordens da sua unidade.');
      }
    }

    const resultado = await this.repository.transaction(async (tx: any) => {
      const updateData: any = { status };

      if (dadosAdicionais.tecnicoResponsavel !== undefined) {
        updateData.tecnicoResponsavel = dadosAdicionais.tecnicoResponsavel;
      }
      
      if (dadosAdicionais.dataPrevisao !== undefined) {
        updateData.dataPrevisao = dadosAdicionais.dataPrevisao ? new Date(dadosAdicionais.dataPrevisao) : null;
      }

      if (status === StatusManutencao.CONCLUIDA || status === StatusManutencao.CANCELADA) {
        updateData.dataConclusao = new Date();
        if (dadosAdicionais.solucaoAplicada) updateData.solucaoAplicada = dadosAdicionais.solucaoAplicada;
        if (dadosAdicionais.valorGasto) updateData.valorGasto = dadosAdicionais.valorGasto;
        
        const statusAtivo = await tx.statusEquipamento.findFirst({
          where: { nome: 'ATIVO' }
        });
        if (statusAtivo) {
          await tx.equipamento.update({
            where: { id: os.equipamentoId },
            data: { statusId: statusAtivo.id }
          });
        }
      }

      const osAtualizada = await tx.ordemServico.update({
        where: { id },
        data: updateData
      });

      await tx.logOperacao.create({
        data: {
          equipamentoId: os.equipamentoId,
          usuarioId: usuario.id,
          acao: AcaoLog.ATUALIZACAO_OS,
          descricao: `OS #${os.id} alterada para ${status}.`
        }
      });

      return osAtualizada;
    });

    this.notificationsService.notificarAtualizacaoGlobal();
    return resultado;
  }

  async criarMassa(dados: any, usuario: any) {
    const userFull = await this.repository.findUsuarioCompleto(usuario.id);
    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    if (userFull.perfil === PerfilUsuario.DIRETORIA) {
      throw new ForbiddenException('Usuários de Diretoria não podem abrir ordens de serviço em massa.');
    }

    const userBatalhaoId = userFull.batalhaoId || userFull.secao?.batalhaoId;
    if (!userBatalhaoId && userFull.perfil !== PerfilUsuario.ADMIN_DTEC) {
      throw new ForbiddenException('Usuário sem batalhão válido.');
    }

    const { ids, descricaoProblema, tecnicoResponsavel, dataPrevisao } = dados;
    const statusManutencao = await this.repository.getStatusManutencao();

    const resultado = await this.repository.transaction(async (tx: any) => {
      const ordens = [];
      for (const equipamentoId of ids) {
        const equipamento = await tx.equipamento.findUnique({ where: { id: equipamentoId }, include: { secao: true } });
        if (!equipamento) throw new NotFoundException(`Equipamento ID ${equipamentoId} não encontrado`);

        if (userFull.perfil !== PerfilUsuario.ADMIN_DTEC && equipamento.secao?.batalhaoId !== userBatalhaoId) {
          throw new ForbiddenException('Você só pode abrir ordens de serviço em massa para equipamentos da sua unidade.');
        }

        const os = await tx.ordemServico.create({
          data: {
            equipamentoId,
            solicitanteId: usuario.id,
            descricaoProblema,
            tecnicoResponsavel,
            dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : null,
            status: StatusManutencao.ABERTA
          }
        });

        if (statusManutencao) {
          await tx.equipamento.update({
            where: { id: equipamentoId },
            data: { statusId: statusManutencao.id }
          });
        }

        await tx.logOperacao.create({
          data: {
            equipamentoId,
            usuarioId: usuario.id,
            acao: AcaoLog.ABERTURA_OS,
            descricao: `Ordem de Serviço #${os.id} aberta via ação em massa. Problema: ${descricaoProblema}`
          }
        });

        ordens.push(os);
      }
      return ordens;
    });

    this.notificationsService.notificarAtualizacaoGlobal();
    return resultado;
  }

  async obterHistorico(id: number) {
    const os = await this.repository.findOrdemById(id);
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');
    return this.repository.getLogsByEquipamento(os.equipamentoId);
  }
}






