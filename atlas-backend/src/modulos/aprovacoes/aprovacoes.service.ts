import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PerfilUsuario } from '@prisma/client';
import { I_APROVACAO_REPOSITORIO } from './repositorios/aprovacoes.repository.interface';
import type { IAprovacaoRepositorio } from './repositorios/aprovacoes.repository.interface';
import { AuditService } from '../../compartilhado/servicos/audit.service';
import { NotificationsService } from '../notificacoes/notificacoes.service';
import { AcaoLog } from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(
    @Inject(I_APROVACAO_REPOSITORIO)
    private readonly repository: IAprovacaoRepositorio,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async criarSolicitacao(
    equipamentoId: number,
    solicitanteId: number,
    dadosNovos: any,
    dadosAntigos: any,
  ) {
    const camposAlterados = Object.keys(dadosNovos).filter(
      (key) =>
        JSON.stringify(dadosNovos[key]) !== JSON.stringify(dadosAntigos[key]),
    );

    if (camposAlterados.length === 0) {
      return { message: 'Nenhuma alteração detectada' };
    }

    const pendencia = await this.repository.criar(
      equipamentoId,
      solicitanteId,
      dadosNovos,
      dadosAntigos,
      camposAlterados,
    );

    const diff = await this.auditService.gerarDiffComLabels(
      dadosAntigos,
      dadosNovos,
    );
    if (diff) {
      await this.auditService.registrarLog({
        usuarioId: solicitanteId,
        equipamentoId,
        acao: AcaoLog.UPDATE,
        descricao: `Solicitação de alteração para o equipamento ${dadosAntigos?.patrimonio ?? equipamentoId}.`,
        dadosAlterados: diff,
      });
    }

    this.notificationsService.notificarAtualizacaoGlobal();

    return pendencia;
  }

  async listarPendentesPorUnidade(batalhaoId?: number) {
    return this.repository.listarPendentesPorUnidade(batalhaoId);
  }

  async listarTodas() {
    return this.repository.listarTodas();
  }

  async contarPendentes(batalhaoId?: number) {
    return this.repository.contarPendentes(batalhaoId);
  }

  async obterPendencia(id: number) {
    const pendencia = await this.repository.obterPendencia(id);

    if (!pendencia) {
      throw new NotFoundException('Solicitação de aprovação não encontrada');
    }

    return pendencia;
  }

  async processarDecisao(
    id: number,
    aprovado: boolean,
    usuario: any,
    motivoNegacao?: string,
  ) {
    if (
      usuario.perfil !== PerfilUsuario.ADMIN_DTEC &&
      usuario.perfil !== PerfilUsuario.COMANDANTE
    ) {
      throw new ForbiddenException(
        'Apenas Comandantes ou Administradores podem processar aprovações.',
      );
    }

    const solicitacao = await this.obterPendencia(id);

    if (solicitacao.aprovado !== null) {
      throw new BadRequestException('Solicitação já foi processada');
    }

    if (usuario.perfil === PerfilUsuario.COMANDANTE) {
      const userBatalhaoId = usuario.batalhaoId;
      if (
        !userBatalhaoId ||
        solicitacao.equipamento?.secao?.batalhaoId !== userBatalhaoId
      ) {
        throw new ForbiddenException(
          'Você só pode processar aprovações de sua unidade.',
        );
      }
    }

    const resultado = await this.repository.processarDecisao(
      id,
      aprovado,
      usuario.id,
      motivoNegacao,
      { solicitacao },
    );

    this.notificationsService.notificarAtualizacaoGlobal();
    this.notificationsService.notificarDecisaoAlteracao(
      solicitacao.solicitanteId,
      aprovado,
      solicitacao.equipamento.patrimonio,
    );

    return resultado;
  }
}
