import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoansService } from '../../services/loans.service';
import { PdfService } from '../../services/pdf.service';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-loans-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    DialogModule, DropdownModule, ButtonModule, InputTextModule,
    DatePickerModule, ToastModule, TabsModule, TooltipModule, TableModule
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './loans-management.component.html',
  styleUrl: './loans-management.component.scss',
})
export class LoansManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private LoansService = inject(LoansService);
  private pdfService = inject(PdfService);
  private messageService = inject(MessageService);

  emprestados: any[]    = [];
  historico: any[]      = [];
  vencidos: any[]       = [];
  equipamentos: any[]   = [];
  selecionados: any[]   = []; // Itens marcados na tabela
  carregando            = true;
  abaAtiva              = '0';
  dataHoje              = new Date();
  filtroData: Date[]    = []; // Filtro de intervalo de datas para o histórico

  // Modal SEI
  exibirModalSEI = false;

  // Modal saída
  exibirModalSaida = false;
  equipamentoSelecionado: any = null;
  formSaida: FormGroup;

  // Modal retorno
  exibirModalRetorno = false;
  itemRetorno: any = null;

  constructor() {
    this.formSaida = this.fb.group({
      equipamentoId: [null, Validators.required],
      solicitante:   ['',   Validators.required],
      dataSolicitacao:      [new Date(), Validators.required],
      dataRetornoEmprestimo: [null],
    });
  }

  get historicoFiltrado(): any[] {
    if (!this.filtroData || this.filtroData.length < 2 || !this.filtroData[0] || !this.filtroData[1]) {
      return this.historico;
    }
    
    const inicio = new Date(this.filtroData[0]);
    const fim    = new Date(this.filtroData[1]);
    fim.setHours(23, 59, 59, 999);

    return this.historico.filter(it => {
      const data = new Date(it.dataSolicitacao);
      return data >= inicio && data <= fim;
    });
  }

  ngOnInit() { this.carregarTudo(); }

  carregarTudo() {
    this.carregando = true;
    this.LoansService.listarEmprestados().subscribe({
      next: r => { this.emprestados = r; this.carregando = false; },
      error: () => this.carregando = false
    });
    this.LoansService.historico().subscribe(r => this.historico = r);
    this.LoansService.vencidos().subscribe(r => this.vencidos = r);
    this.pesquisarEquipamentosDisponiveis('');
  }

  pesquisarEquipamentosDisponiveis(termo: string) {
    this.LoansService.listarEquipamentosDisponiveis(termo).subscribe(r => {
      const itens = r.itens || [];
      // Filtra apenas os que estão como DISPONÍVEL no sistema
      this.equipamentos = itens.filter((e: any) => e.disponibilidade?.nome?.toUpperCase() === 'DISPONÍVEL');
    });
  }

  onFiltrarEquipamento(event: any) {
    this.pesquisarEquipamentosDisponiveis(event.filter || '');
  }

  abrirSaida() {
    this.formSaida.reset({ dataSolicitacao: new Date() });
    this.pesquisarEquipamentosDisponiveis('');
    this.exibirModalSaida = true;
  }

  confirmarSaida() {
    if (this.formSaida.invalid) return;
    const v = this.formSaida.value;
    const dados = {
      solicitante: v.solicitante,
      dataSolicitacao: (v.dataSolicitacao as Date).toISOString(),
      dataRetornoEmprestimo: v.dataRetornoEmprestimo
        ? (v.dataRetornoEmprestimo as Date).toISOString()
        : undefined,
    };
    this.LoansService.registrarSaida(v.equipamentoId, dados).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saída registrada!', detail: 'Equipamento marcado como Emprestado.' });
        this.exibirModalSaida = false;
        this.carregarTudo();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível registrar a saída.' }),
    });
  }

  abrirRetorno(item: any) {
    this.itemRetorno = item;
    this.exibirModalRetorno = true;
  }

  confirmarRetorno() {
    if (!this.itemRetorno) return;
    this.LoansService.registrarRetorno(this.itemRetorno.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Retorno confirmado!', detail: 'Equipamento marcado como Disponível.' });
        this.exibirModalRetorno = false;
        this.itemRetorno = null;
        this.carregarTudo();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível confirmar o retorno.' }),
    });
  }

  imprimirCautela(item: any) {
    this.pdfService.gerarCautela(item);
  }

  imprimirCautelaMassa() {
    if (this.selecionados.length === 0) return;
    this.pdfService.gerarCautelaColetiva(this.selecionados);
  }

  confirmarRetornoMassa() {
    if (this.selecionados.length === 0) return;
    if (!confirm(`Deseja baixar o retorno de ${this.selecionados.length} equipamentos em lote?`)) return;

    this.carregando = true;
    const requests = this.selecionados.map(item => this.LoansService.registrarRetorno(item.id));
    
    // Simplificando o processamento em lote
    let concluidos = 0;
    requests.forEach(req => {
      req.subscribe({
        next: () => {
          concluidos++;
          if (concluidos === requests.length) {
            this.messageService.add({ severity: 'success', summary: 'Lote Processado', detail: `${concluidos} equipamentos retornaram ao inventário.` });
            this.selecionados = [];
            this.carregarTudo();
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erro em Lote', detail: 'Alguns itens podem não ter sido processados.' });
          this.carregando = false;
        }
      });
    });
  }

  abrirModalSEI() {
    if (this.selecionados.length === 0) return;
    this.exibirModalSEI = true;
  }

  async copiarTextoSEI() {
    const el = document.getElementById('termo-sei-content');
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
      // Fallback para navegadores que não suportam ClipboardItem HTML
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

  isVencido(item: any): boolean {
    if (!item.dataRetornoEmprestimo) return false;
    return new Date(item.dataRetornoEmprestimo) < new Date();
  }

  diasAtraso(item: any): number {
    if (!item.dataRetornoEmprestimo) return 0;
    const diff = new Date().getTime() - new Date(item.dataRetornoEmprestimo).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

