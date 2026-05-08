import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CriarOrdemServicoDto } from './dto/maintenance.dto';
import { StatusManutencao, AcaoLog, PerfilUsuario } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async listarTodos(usuario: any) {
    const userFull = await this.prisma.usuario.findUnique({
      where: { id: usuario.id },
      include: { secao: true, batalhao: true, secoesPermitidas: true },
    });

    if (!userFull) throw new NotFoundException('Usuário não encontrado');

    const and: any[] = [];

    // Lógica de Permissões
    if (userFull.perfil === PerfilUsuario.ADMIN_DTEC) {
      // Vê tudo, nenhum filtro necessário
    } else {
      const secoesIds = [
        userFull.secaoId,
        ...userFull.secoesPermitidas.map(s => s.secaoId)
      ].filter(Boolean);

      if (userFull.perfil === PerfilUsuario.DIRETORIA) {
        const diretoriaId = userFull.secao?.diretoriaId || userFull.batalhao?.diretoriaId;
        and.push({
          OR: [
            { equipamento: { secaoId: { in: secoesIds } } },
            { equipamento: { secao: { diretoriaId } } }
          ]
        });
      } else if (userFull.perfil === PerfilUsuario.COMANDANTE) {
        const batalhaoId = userFull.secao?.batalhaoId || userFull.batalhaoId;
        and.push({
          OR: [
            { equipamento: { secaoId: { in: secoesIds } } },
            { equipamento: { secao: { batalhaoId } } }
          ]
        });
      } else {
        // Usuário Batalhão
        and.push({
          equipamento: { secaoId: { in: secoesIds } }
        });
      }
    }

    const where = and.length > 0 ? { AND: and } : {};

    return this.prisma.ordemServico.findMany({
      where,
      include: {
        equipamento: {
          include: { tipoEquipamento: true, marca: true }
        },
        solicitante: true
      },
      orderBy: { dataAbertura: 'desc' }
    });
  }

  async buscarPorId(id: number) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: {
        equipamento: true,
        solicitante: true
      }
    });

    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');
    return os;
  }

  async criar(dados: CriarOrdemServicoDto, usuarioId: number) {
    const { equipamentoId, descricaoProblema, tecnicoResponsavel, dataPrevisao } = dados;

    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id: equipamentoId }
    });

    if (!equipamento) throw new NotFoundException('Equipamento não encontrado');

    const statusManutencao = await this.prisma.statusEquipamento.findFirst({
      where: { nome: 'MANUTENÇÃO' }
    });

    const resultado = await this.prisma.$transaction(async (tx: any) => {
      const os = await tx.ordemServico.create({
        data: {
          equipamentoId,
          solicitanteId: usuarioId,
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
          usuarioId,
          acao: AcaoLog.ABERTURA_OS,
          descricao: `Ordem de Serviço #${os.id} aberta. Problema: ${descricaoProblema}`
        }
      });

      return os;
    });

    this.notificationsService.notificarAtualizacaoGlobal();
    return resultado;
  }

  async atualizarStatus(id: number, status: StatusManutencao, dadosAdicionais: any = {}, usuarioId: number) {
    const os = await this.prisma.ordemServico.findUnique({ where: { id } });
    if (!os) throw new NotFoundException('Ordem de Serviço não encontrada');

    const resultado = await this.prisma.$transaction(async (tx: any) => {
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
          usuarioId,
          acao: AcaoLog.ATUALIZACAO_OS,
          descricao: `OS #${os.id} alterada para ${status}.`
        }
      });

      return osAtualizada;
    });

    this.notificationsService.notificarAtualizacaoGlobal();
    return resultado;
  }

  async criarMassa(dados: any, usuarioId: number) {
    const { ids, descricaoProblema, tecnicoResponsavel, dataPrevisao } = dados;

    const statusManutencao = await this.prisma.statusEquipamento.findFirst({
      where: { nome: 'MANUTENÇÃO' }
    });

    const resultado = await this.prisma.$transaction(async (tx: any) => {
      const ordens = [];

      for (const equipamentoId of ids) {
        const os = await tx.ordemServico.create({
          data: {
            equipamentoId,
            solicitanteId: usuarioId,
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
            usuarioId,
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
}






