import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { PdfService } from '../../../nucleo/servicos/pdf.service';
import { Equipamento } from '../../../nucleo/interfaces/equipamento.interface';
import { UsuarioLogado } from '../../../nucleo/interfaces/usuario.interface';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';

@Component({
  selector: 'app-lista-transferencias',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule, SelectModule,
    ButtonModule, Textarea, InputTextModule, ToastModule, TooltipModule, TableModule,
    ConfirmDialogModule, LayoutPaginaComponent, EstadoVazioComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lista-transferencias.component.html',
  styleUrls: ['./lista-transferencias.component.scss'],
})
export class TransfersListComponent implements OnInit {
  private transferService = inject(TransfersService);
  private authService = inject(AuthService);
  private configService = inject(SettingsService);
  private equipmentService = inject(EquipmentService);
  private pdfService = inject(PdfService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  pendentes: Record<string, unknown>[] = [];
  selecionados: any[] = [];
  equipamentosDisponiveis: Equipamento[] = [];
  secoes: Record<string, unknown>[] = [];
  carregando = false;

  // Modal Solicitar
  exibirModalSolicitar = false;
  novaTransferencia = {
    equipamentoId: null,
    destinoId: null,
    observacao: ''
  };

  exibirModalSEI = false;
  dataHoje = new Date();

  usuarioLogado: UsuarioLogado | null = null;

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
    this.transferService.listar().subscribe({
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
      // Administradores podem ver todos os equipamentos. Usuários comuns só veem os da própria seção.
      if (this.usuarioLogado?.perfil === 'ADMIN_DTEC' || this.usuarioLogado?.perfil === 'COMANDANTE') {
        this.equipamentosDisponiveis = res.itens;
      } else {
        this.equipamentosDisponiveis = res.itens.filter((e) => e.secao?.id === this.usuarioLogado?.secaoId);
      }
    });
  }

  abrirSolicitar() {
    this.novaTransferencia = { equipamentoId: null, destinoId: null, observacao: '' };
    this.exibirModalSolicitar = true;
  }

  confirmarSolicitacao() {
    if (!this.novaTransferencia.equipamentoId || !this.novaTransferencia.destinoId) return;

    this.transferService.solicitar(this.novaTransferencia as unknown as { equipamentoId: number; destinoId: number; observacao?: string }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Transferência solicitada!' });
        this.exibirModalSolicitar = false;
        this.carregarDados();
      },
      error: (err: unknown) => console.error(err)
    });
  }

  // Ações de aprovação/recebimento foram movidas para o módulo de Aprovações

  isCelularSEI = false;
  abrirModalSEI(isCelular: boolean = false) {
    if (this.selecionados.length === 0) return;
    this.isCelularSEI = isCelular;
    this.exibirModalSEI = true;
  }

  async copiarTextoSEI() {
    const el = document.getElementById('termo-sei-content-transfer');
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
      eq.secao = s.destino;
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
}
