import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApprovalsService } from '../../../nucleo/servicos/aprovacoes.service';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { NotificationsService } from '../../../nucleo/servicos/notificacoes.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';

@Component({
  selector: 'app-lista-aprovacoes',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, Textarea, ToastModule, TooltipModule, FormsModule, ConfirmDialogModule, TabsModule, TableModule, LayoutPaginaComponent, EstadoVazioComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lista-aprovacoes.component.html',
  styleUrls: ['./lista-aprovacoes.component.scss']
})
export class ApprovalsListComponent implements OnInit {
  private approvalsService = inject(ApprovalsService);
  private transfersService = inject(TransfersService);
  private notificationsService = inject(NotificationsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  pendencias: any[] = [];
  transferencias: any[] = []; // Transferências pendentes gerais (saída/entrada)
  
  carregando = true;
  abaAtiva = 0;
  ehAdmin = false;
  usuarioLogado: any = null;

  exibirModalNegar = false;
  exibirModalDetalhes = false;
  pendenciaSelecionada: any = null;
  motivoNegacao = '';

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuario();
    const perfil = this.usuarioLogado?.perfil;
    this.ehAdmin = perfil === 'ADMIN_DTEC' || perfil === 'DIRETORIA';
    this.carregarTudo();
  }

  carregarTudo() {
    this.carregar();
    this.carregarTransferencias();
  }

  carregarTransferencias() {
    this.transfersService.listarPendentes().subscribe({
      next: (res) => {
        this.transferencias = res;
      },
      error: () => {}
    });
  }

  get transEnviadas(): any[] {
    if (this.ehAdmin) return this.transferencias;
    return this.transferencias.filter(t => t.origemId === this.usuarioLogado?.secaoId);
  }

  get transRecebidas(): any[] {
    if (this.ehAdmin) return this.transferencias;
    return this.transferencias.filter(t => t.destinoId === this.usuarioLogado?.secaoId);
  }

  get podeAprovarRecebimento(): boolean {
    return this.usuarioLogado?.perfil === 'COMANDANTE' || this.ehAdmin;
  }

  receberTransferencia(id: number) {
    this.confirmationService.confirm({
      message: 'Deseja confirmar o recebimento deste material?',
      header: 'Recebimento de Carga',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.transfersService.confirmar(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Material recebido.' });
            this.carregarTransferencias();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao confirmar.' })
        });
      }
    });
  }

  cancelarTransferencia(id: number) {
    this.confirmationService.confirm({
      message: 'Deseja cancelar o envio desta carga?',
      header: 'Cancelar Envio',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.transfersService.cancelar(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Cancelado', detail: 'TransferÃªncia cancelada.' });
            this.carregarTransferencias();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao cancelar.' })
        });
      }
    });
  }

  verDetalhes(p: any) {
    this.pendenciaSelecionada = p;
    this.exibirModalDetalhes = true;
  }

  cancelarPedido(p: any) {
    this.confirmationService.confirm({
      message: 'Deseja realmente cancelar esta solicitação de alteração?',
      header: 'Cancelar Solicitação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Cancelar',
      rejectLabel: 'Voltar',
      accept: () => {
        this.approvalsService.processarDecisao(p.id, false, 'Cancelado pelo próprio solicitante').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Cancelado', detail: 'Sua solicitação foi cancelada.' });
            this.notificationsService.atualizarContagem();
            this.carregar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível cancelar.' })
        });
      }
    });
  }

  carregar() {
    this.carregando = true;
    this.approvalsService.listarPendentes().subscribe({
      next: (res) => {
        this.pendencias = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
  }

  aprovar(id: number) {
    this.confirmationService.confirm({
      message: 'Deseja realmente aprovar esta alteração?',
      header: 'Confirmar Aprovação',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.approvalsService.processarDecisao(id, true, '').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Aprovado', detail: 'Alteração aplicada ao equipamento.' });
            this.notificationsService.atualizarContagem();
            this.carregar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível aprovar.' })
        });
      }
    });
  }

  abrirNegar(p: any) {
    this.pendenciaSelecionada = p;
    this.motivoNegacao = '';
    this.exibirModalNegar = true;
  }

  confirmarNegar() {
    if (!this.motivoNegacao) return;
    this.approvalsService.processarDecisao(this.pendenciaSelecionada.id, false, this.motivoNegacao).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Negado', detail: 'A alteração foi descartada.' });
        this.notificationsService.atualizarContagem();
        this.exibirModalNegar = false;
        this.carregar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível processar.' })
    });
  }

  traduzirCampo(campo: string): string {
    const mapa: any = {
      patrimonio: 'Patrimônio',
      tipoEquipamentoId: 'Tipo',
      statusId: 'Status',
      secaoId: 'Seção',
      marcaId: 'Marca',
      modeloId: 'Modelo',
      numeroSerie: 'Nº Série',
      observacao: 'Observações',
      _acao: 'Ação Requerida'
    };
    return mapa[campo] || campo;
  }
  
  traduzirValor(valor: any): string {
    if (valor === 'DELETE') return 'Excluir Equipamento';
    return valor || '—';
  }
}


