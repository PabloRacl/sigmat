import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notificacoes.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  /**
   * Notifica sobre uma nova transferência pendente para os comandantes da unidade de destino
   */
  notificarNovaTransferencia(batalhaoId: number, dados: any) {
    // Aqui poderíamos filtrar usuários por batalhão, mas por enquanto vamos emitir um evento global
    // ou um evento específico para quem estiver ouvindo por unidade
    this.gateway.enviarParaTodos(`nova_transferencia_${batalhaoId}`, {
      mensagem: `Nova transferência solicitada para sua unidade.`,
      equipamento: dados.patrimonio,
      origem: dados.origem,
    });
  }

  /**
   * Notifica o solicitante sobre a aprovação ou negação de uma alteração
   */
  notificarDecisaoAlteracao(userId: number, aprovado: boolean, patrimonio: string) {
    this.gateway.enviarParaUsuario(userId, 'decisao_alteracao', {
      aprovado,
      mensagem: `Sua solicitação de alteração para o equipamento ${patrimonio} foi ${aprovado ? 'APROVADA' : 'NEGADA'}.`,
    });
  }

  /**
   * Notificação genérica
   */
  notificar(userId: number, mensagem: string, tipo: 'info' | 'success' | 'warn' | 'error' = 'info') {
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

  notificarNovaSolicitacaoAcesso(payload: any) {
    this.gateway.enviarParaTodos('nova_solicitacao_acesso', payload);
  }
}
