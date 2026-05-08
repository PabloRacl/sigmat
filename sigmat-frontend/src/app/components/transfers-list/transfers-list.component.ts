import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransfersService } from '../../services/transfers.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { EquipmentService } from '../../services/equipment.service';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-transfers-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule, DropdownModule,
    ButtonModule, InputTextarea, InputTextModule, ToastModule, TooltipModule, TableModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './transfers-list.component.html',
  styleUrl: './transfers-list.component.scss',
})
export class TransfersListComponent implements OnInit {
  private transferService = inject(TransfersService);
  private authService = inject(AuthService);
  private configService = inject(SettingsService);
  private equipmentService = inject(EquipmentService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  pendentes: any[] = [];
  equipamentosDisponiveis: any[] = [];
  secoes: any[] = [];
  carregando = false;

  // Modal Solicitar
  exibirModalSolicitar = false;
  novaTransferencia = {
    equipamentoId: null,
    destinoId: null,
    observacao: ''
  };

  usuarioLogado: any = null;

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuario();
    this.carregarDados();
    this.carregarAuxiliares();
  }

  get podeAprovar(): boolean {
    return this.usuarioLogado?.perfil === 'COMANDANTE' || this.usuarioLogado?.perfil === 'ADMIN_DTEC';
  }

  carregarDados() {
    this.carregando = true;
    this.transferService.listarPendentes().subscribe({
      next: (res) => {
        this.pendentes = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
  }

  carregarAuxiliares() {
    this.configService.listarSecoes().subscribe(res => this.secoes = res);
    this.equipmentService.listarTodos(1, 1000).subscribe(res => {
      // Apenas equipamentos da seção do usuário logado
      this.equipamentosDisponiveis = res.itens.filter((e: any) => e.secaoId === this.usuarioLogado.secaoId);
    });
  }

  abrirSolicitar() {
    this.novaTransferencia = { equipamentoId: null, destinoId: null, observacao: '' };
    this.exibirModalSolicitar = true;
  }

  confirmarSolicitacao() {
    if (!this.novaTransferencia.equipamentoId || !this.novaTransferencia.destinoId) return;

    this.transferService.solicitar(this.novaTransferencia as any).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Transferência solicitada!' });
        this.exibirModalSolicitar = false;
        this.carregarDados();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao solicitar transferência.' })
    });
  }

  receber(id: number) {
    this.confirmationService.confirm({
      message: 'Deseja confirmar o recebimento deste material?',
      header: 'Confirmação de Recebimento',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, Receber',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.transferService.confirmar(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Concluído', detail: 'Material recebido e carga atualizada!' });
            this.carregarDados();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao confirmar recebimento.' })
        });
      }
    });
  }

  cancelar(id: number) {
    if (!confirm('Deseja cancelar esta solicitação?')) return;
    this.transferService.cancelar(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Cancelado', detail: 'Transferência cancelada.' });
        this.carregarDados();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao cancelar.' })
    });
  }
}

