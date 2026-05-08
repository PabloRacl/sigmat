import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApprovalsService } from '../../services/approvals.service';
import { NotificationsService } from '../../services/notifications.service';
import { AuthService } from '../../services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-approvals-list',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, InputTextarea, ToastModule, TooltipModule, FormsModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './approvals-list.component.html',
  styleUrl: './approvals-list.component.scss'
})
export class ApprovalsListComponent implements OnInit {
  private approvalsService = inject(ApprovalsService);
  private notificationsService = inject(NotificationsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  pendencias: any[] = [];
  carregando = true;
  ehAdmin = false;

  exibirModalNegar = false;
  exibirModalDetalhes = false;
  pendenciaSelecionada: any = null;
  motivoNegacao = '';

  ngOnInit() {
    const perfil = this.authService.getUsuario()?.perfil;
    this.ehAdmin = perfil === 'ADMIN_DTEC' || perfil === 'DIRETORIA';
    this.carregar();
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
    if (window.confirm('Deseja realmente aprovar esta alteração?')) {
      this.approvalsService.processarDecisao(id, true, '').subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Aprovado', detail: 'Alteração aplicada ao equipamento.' });
          this.notificationsService.atualizarContagem();
          this.carregar();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível aprovar.' })
      });
    }
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

