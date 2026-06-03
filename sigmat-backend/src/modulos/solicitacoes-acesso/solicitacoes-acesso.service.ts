import { Injectable, ConflictException } from '@nestjs/common';
import { AccessRequestsRepository } from './solicitacoes-acesso.repository';
import { NotificationsService } from '../notificacoes/notificacoes.service';

@Injectable()
export class AccessRequestsService {
  constructor(
    private readonly repository: AccessRequestsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async solicitarAcesso(dados: any) {
    const existe = await this.repository.findFirst({
      where: {
        login: dados.login,
        status: 'PENDENTE',
      },
    });

    if (existe) {
      throw new ConflictException('Já existe uma solicitação de acesso pendente para este login.');
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
}
