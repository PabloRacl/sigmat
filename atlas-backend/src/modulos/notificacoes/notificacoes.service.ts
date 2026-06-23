import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notificacoes.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  /**
   * Notifica sobre uma nova transferência pendente para os comandantes da unidade de destino
   */
  notificarNovaTransferencia(batalhaoId: number, dados: Record<string, any>) {
    // Agora enviamos a notificação estritamente para o room do batalhão destino
    this.gateway.enviarParaBatalhao(batalhaoId, `nova_transferencia_${batalhaoId}`, {
      mensagem: `Nova transferência solicitada para sua unidade.`,
      equipamento: dados.patrimonio,
      origem: dados.origem,
    });
    // Também podemos notificar os admins, se desejado
    this.gateway.enviarParaAdmin('nova_transferencia', {
      mensagem: `Nova transferência solicitada.`,
      equipamento: dados.patrimonio,
      origem: dados.origem,
    });
  }

  /**
   * Notifica o solicitante sobre a aprovação ou negação de uma alteração
   */
  notificarDecisaoAlteracao(
    userId: number,
    aprovado: boolean,
    patrimonio: string,
  ) {
    this.gateway.enviarParaUsuario(userId, 'decisao_alteracao', {
      aprovado,
      mensagem: `Sua solicitação de alteração para o equipamento ${patrimonio} foi ${aprovado ? 'APROVADA' : 'NEGADA'}.`,
    });
  }

  /**
   * Notificação genérica
   */
  notificar(
    userId: number,
    mensagem: string,
    tipo: 'info' | 'success' | 'warn' | 'error' = 'info',
  ) {
    this.gateway.enviarParaUsuario(userId, 'notificacao_geral', {
      mensagem,
      tipo,
    });
  }

  /**
   * Força todos os clientes conectados a atualizarem seus contadores (badge)
   */
  notificarAtualizacaoGlobal() {
    this.gateway.enviarParaTodos('atualizar_notificacoes', {});
  }

  notificarNovaSolicitacaoAcesso(payload: Record<string, any>) {
    // Solicitações de acesso são apenas para a DTEC aprovar
    this.gateway.enviarParaAdmin('nova_solicitacao_acesso', payload);
  }
}
