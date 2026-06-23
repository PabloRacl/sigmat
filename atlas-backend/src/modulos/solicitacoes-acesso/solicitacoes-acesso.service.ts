import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { AccessRequestsRepository } from './solicitacoes-acesso.repository';
import { NotificationsService } from '../notificacoes/notificacoes.service';
import { PrismaService } from '../../banco-dados/prisma.service';
import { BasesCorporativasService } from '../../integracoes/bases-corporativas/bases-corporativas.service';

@Injectable()
export class AccessRequestsService {
  private readonly logger = new Logger(AccessRequestsService.name);

  constructor(
    private readonly repository: AccessRequestsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly sgaService: BasesCorporativasService,
  ) {}

  async solicitarAcesso(dados: any) {
    const existe = await this.repository.findFirst({
      where: {
        login: dados.login,
        status: 'PENDENTE',
      },
    });

    if (existe) {
      throw new ConflictException(
        'Já existe uma solicitação de acesso pendente para este login.',
      );
    }

    const novaSolicitacao = await this.repository.create({
      data: {
        login: dados.login,
        cpf: dados.cpf,
        matricula: dados.matricula,
        nome: dados.nome,
        email: dados.email,
        postoGraduacao: dados.postoGraduacao,
        organizacaoDisp: dados.organizacaoDisp,
        secaoSigla: dados.secaoSigla,
        perfil: dados.perfil,
      },
    });

    this.notificationsService.notificarAtualizacaoGlobal();
    this.notificationsService.notificarNovaSolicitacaoAcesso({
      mensagem: `Nova solicitação de acesso de ${dados.nome || dados.login}.`,
      login: dados.login,
      nome: dados.nome,
      perfil: dados.perfil,
    });

    return novaSolicitacao;
  }

  async listarPendentes() {
    return this.repository.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async aprovar(id: number, dadosCuradoria?: { perfil?: string; secaoId?: number; batalhaoId?: number }) {
    // 1. Recuperar os dados completos da solicitação
    const solicitacao = await this.repository.findFirst({ where: { id } });
    if (!solicitacao) throw new Error("Solicitação não encontrada.");

    const perfilFinal = dadosCuradoria?.perfil || solicitacao.perfil || 'USUARIO_BATALHAO';

    // 2. Criar localmente o usuário no banco de dados Atlas
    const usuarioLocal = await this.prisma.usuario.create({
      data: {
        login: solicitacao.login,
        nome: solicitacao.nome,
        cpf: solicitacao.cpf,
        matricula: solicitacao.matricula || solicitacao.login,
        email: solicitacao.email,
        postoGraduacao: solicitacao.postoGraduacao,
        perfil: perfilFinal as any,
        secaoId: dadosCuradoria?.secaoId,
        batalhaoId: dadosCuradoria?.batalhaoId,
        autorizado: true,
      }
    });

    this.logger.log(`Usuário ${usuarioLocal.login} criado localmente com sucesso (Perfil Final: ${perfilFinal})!`);

    const solicitacaoFinal = { ...solicitacao, perfil: perfilFinal };

    // 3. Provisionamento no sistema SGA
    try {
      await this.sgaService.provisionarUsuarioSga(solicitacaoFinal);
    } catch (e) {
      this.logger.warn(`Falha não obstrutiva no provisionamento para o SGA: ${e}`);
    }

    // 4. Marcar solicitação como aprovada
    const solicitacaoAtualizada = await this.repository.update({
      where: { id },
      data: { status: 'APROVADA' },
    });
    
    return solicitacaoAtualizada;
  }

  async rejeitar(id: number, motivo?: string) {
    return this.repository.update({
      where: { id },
      data: { status: 'REJEITADA', motivoRejeicao: motivo },
    });
  }
}
