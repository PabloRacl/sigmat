import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApprovalsService } from '../../../nucleo/servicos/aprovacoes.service';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { PdfService } from '../../../nucleo/servicos/pdf.service';
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
  private pdfService = inject(PdfService);
  private notificationsService = inject(NotificationsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  pendencias: any[] = [];
  transferencias: any[] = [];
  selecionados: any[] = [];
  
  carregando = true;
  abaAtiva = 0;
  ehAdmin = false;
  usuarioLogado: any = null;

  exibirModalNegar = false;
  exibirModalDetalhes = false;
  exibirModalSEI = false;
  pendenciaSelecionada: any = null;
  motivoNegacao = '';
  
  exibirModalRejeitarTransferencia = false;
  motivoRejeicaoTransferencia = '';
  isRejeicaoLote = false;
  transferenciaSelecionadaId: number | null = null;
  
  dataHoje = new Date();

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuario();
    const perfil = this.usuarioLogado?.perfil;
    this.ehAdmin = perfil === 'ADMIN_DTEC' || perfil === 'DIRETORIA';
    this.carregar();
    this.carregarTransferencias();
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
          error: (err) => console.error(err)
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

  carregarTransferencias() {
    this.transfersService.listarPendentes().subscribe({
      next: (res) => {
        this.transferencias = res;
      },
      error: (err) => console.error(err)
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
        this.transfersService.confirmar(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Concluído', detail: 'Material recebido e carga atualizada!' });
            this.carregarTransferencias();
          },
          error: (err: any) => console.error(err)
        });
      }
    });
  }

  abrirModalRejeicaoTransferencia(id?: number) {
    this.motivoRejeicaoTransferencia = '';
    if (id) {
      this.isRejeicaoLote = false;
      this.transferenciaSelecionadaId = id;
    } else {
      if (this.selecionados.length === 0) return;
      this.isRejeicaoLote = true;
    }
    this.exibirModalRejeitarTransferencia = true;
  }

  confirmarRejeitarTransferencia() {
    if (!this.motivoRejeicaoTransferencia) return;

    if (this.isRejeicaoLote) {
      const ids = this.selecionados.map(s => s.id);
      this.transfersService.cancelarLote(ids, this.motivoRejeicaoTransferencia).subscribe({
        next: () => {
          this.messageService.add({ severity: 'warn', summary: 'Cancelado', detail: 'Lote cancelado.' });
          this.selecionados = [];
          this.exibirModalRejeitarTransferencia = false;
          this.carregarTransferencias();
        },
        error: (err: any) => console.error(err)
      });
    } else {
      if (!this.transferenciaSelecionadaId) return;
      this.transfersService.cancelar(this.transferenciaSelecionadaId, this.motivoRejeicaoTransferencia).subscribe({
        next: () => {
          this.messageService.add({ severity: 'warn', summary: 'Cancelado', detail: 'Transferência cancelada.' });
          this.exibirModalRejeitarTransferencia = false;
          this.selecionados = [];
          this.carregarTransferencias();
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  receberLote() {
    if (this.selecionados.length === 0) return;
    const ids = this.selecionados.map(s => s.id);

    this.confirmationService.confirm({
      message: `Deseja receber os ${ids.length} materiais selecionados?`,
      header: 'Recebimento em Lote',
      icon: 'pi pi-check-square',
      acceptLabel: 'Receber Todos',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.transfersService.confirmarLote(ids).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Concluído', detail: 'Lote recebido com sucesso!' });
            this.selecionados = [];
            this.carregarTransferencias();
          },
          error: (err: any) => console.error(err)
        });
      }
    });
  }

  cancelarLote() {
    this.abrirModalRejeicaoTransferencia();
  }

  isCelularSEI = false;
  abrirModalSEI(isCelular: boolean = false) {
    if (this.selecionados.length === 0) return;
    this.isCelularSEI = isCelular;
    this.exibirModalSEI = true;
  }

  async copiarTextoSEI() {
    const el = document.getElementById('termo-sei-content-aprovacoes');
    if (!el) return;

    try {
      const blob = new Blob([el.innerHTML], { type: 'text/html' });
      const richText = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([richText]);
      
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Copiado!', 
        detail: 'Texto formatado copiado. Agora é só dar CTRL+V no SEI.' 
      });
      this.exibirModalSEI = false;
    } catch (err) {
      const range = document.createRange();
      range.selectNode(el);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand('copy');
      window.getSelection()?.removeAllRanges();
      
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Copiado (Alt)', 
        detail: 'Copiado via seleção. Tente colar no SEI.' 
      });
      this.exibirModalSEI = false;
    }
  }

  gerarCautelaColetiva(isCelular: boolean = false) {
    if (this.selecionados.length === 0) return;
    const equipamentos = this.selecionados.map(s => {
      const eq = { ...s.equipamento };
      eq.secao = s.destino; // Aprovação deve exibir a unidade de destino da carga
      return eq;
    }) as Record<string, any>[];
    
    if (isCelular) {
      this.pdfService.gerarCautelaCelulares(equipamentos);
    } else {
      this.pdfService.gerarCautelaColetiva(equipamentos);
    }
  }

  getImei(item: any): string {
    const spec = item?.equipamento?.especificacoes;
    if (!spec) return 'N/A';
    if (typeof spec === 'string') {
      try { return JSON.parse(spec).imei || 'N/A'; } catch (e) { return 'N/A'; }
    }
    return spec.imei || 'N/A';
  }

  getTelefone(item: any): string {
    const spec = item?.equipamento?.especificacoes;
    if (!spec) return 'N/A';
    if (typeof spec === 'string') {
      try { return JSON.parse(spec).telefone || 'N/A'; } catch (e) { return 'N/A'; }
    }
    return spec.telefone || 'N/A';
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
          error: (err) => console.error(err)
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
      error: (err) => console.error(err)
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


