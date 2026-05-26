import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaintenanceService } from '../../services/maintenance.service';
import { EquipmentService } from '../../services/equipment.service';
import { AuthService } from '../../services/auth.service';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    Textarea,
    ToastModule,
    InputNumberModule,
    TooltipModule,
    DatePickerModule,
    AutoCompleteModule,
  ],
  providers: [MessageService],
  templateUrl: './maintenance-list.component.html',
  styleUrl: './maintenance-list.component.scss'
})
export class MaintenanceListComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  private equipmentService = inject(EquipmentService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  get ehAdmin(): boolean {
    const perfil = this.authService.getUsuario()?.perfil;
    return perfil === 'ADMIN_DTEC' || perfil === 'DIRETORIA';
  }

  // ── Dados ────────────────────────────────────────────────────────
  todasOrdens: any[] = [];
  ordensFiltradas: any[] = [];
  carregando = true;
  buscaTexto = '';

  // ── Filtro por Status ─────────────────────────────────────────────
  filtroStatus: string | null = null;

  statusChips = [
    { label: 'Todas',           value: null,              icon: 'pi-list',           cor: 'all' },
    { label: 'Abertas',         value: 'ABERTA',          icon: 'pi-flag',           cor: 'aberta' },
    { label: 'Em Andamento',    value: 'EM_ANDAMENTO',    icon: 'pi-spin pi-cog',    cor: 'em_andamento' },
    { label: 'Aguardando Peça', value: 'AGUARDANDO_PECA', icon: 'pi-clock',          cor: 'aguardando_peca' },
    { label: 'Concluídas',      value: 'CONCLUIDA',       icon: 'pi-check-circle',   cor: 'concluida' },
    { label: 'Canceladas',      value: 'CANCELADA',       icon: 'pi-times-circle',   cor: 'cancelada' },
  ];

  statusOpcoes = [
    { label: 'Aberta',          value: 'ABERTA' },
    { label: 'Em Andamento',    value: 'EM_ANDAMENTO' },
    { label: 'Aguardando Peça', value: 'AGUARDANDO_PECA' },
    { label: 'Concluída',       value: 'CONCLUIDA' },
    { label: 'Cancelada',       value: 'CANCELADA' },
  ];

  // ── Summary cards ─────────────────────────────────────────────────
  get contadorStatus() {
    return {
      total:          this.todasOrdens.length,
      abertas:        this.todasOrdens.filter(o => o.status === 'ABERTA').length,
      emAndamento:    this.todasOrdens.filter(o => o.status === 'EM_ANDAMENTO').length,
      aguardando:     this.todasOrdens.filter(o => o.status === 'AGUARDANDO_PECA').length,
      concluidas:     this.todasOrdens.filter(o => o.status === 'CONCLUIDA').length,
      canceladas:     this.todasOrdens.filter(o => o.status === 'CANCELADA').length,
    };
  }

  // ── Modal: Nova OS ────────────────────────────────────────────────
  exibirModalNovaOS = false;
  novaOsForm: FormGroup;

  // AutoComplete de equipamentos
  equipSugestoes: any[] = [];
  equipamentoNovaOs: any = null;

  // ── Modal: Assistência Premium (3 Colunas) ───────────────────────
  exibirModalAssistencia = false;
  statusForm: FormGroup;
  osSelecionada: any = null;
  historicoOS: any[] = [];
  carregandoHistorico = false;

  constructor() {
    this.novaOsForm = this.fb.group({
      descricaoProblema:  ['', Validators.required],
      tecnicoResponsavel: [''],
      dataPrevisao:       [null],
    });

    this.statusForm = this.fb.group({
      status:             ['', Validators.required],
      tecnicoResponsavel: [''],
      dataPrevisao:       [null],
      solucaoAplicada:    [''],
      valorGasto:         [null],
    });
  }

  ngOnInit() {
    this.carregarDados();

    // Lógica inteligente de previsão de prazos automáticos baseado no status
    this.statusForm.get('status')?.valueChanges.subscribe(status => {
      if (!status || !this.osSelecionada) return;
      const dataAbertura = new Date(this.osSelecionada.dataAbertura);
      const dataAtual = new Date();
      let diasAdicionais = 0;

      if (status === 'EM_ANDAMENTO') {
        diasAdicionais = 2;
      } else if (status === 'AGUARDANDO_PECA') {
        diasAdicionais = 7;
      }

      if (diasAdicionais > 0) {
        const novaPrevisao = new Date();
        novaPrevisao.setDate(dataAtual.getDate() + diasAdicionais);
        this.statusForm.patchValue({ dataPrevisao: novaPrevisao }, { emitEvent: false });
      }
    });
  }

  // ── Carregamento ─────────────────────────────────────────────────
  carregarDados() {
    this.carregando = true;
    this.maintenanceService.listarTodos().subscribe({
      next: (res) => {
        this.todasOrdens = res;
        this.aplicarFiltros();
        this.carregando = false;

        // Se o modal estiver aberto, atualiza a OS selecionada para manter os dados frescos
        if (this.exibirModalAssistencia && this.osSelecionada) {
          const osAtualizada = this.todasOrdens.find(o => o.id === this.osSelecionada.id);
          if (osAtualizada) {
            this.osSelecionada = osAtualizada;
          }
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ordens de serviço.' });
        this.carregando = false;
      }
    });
  }

  // ── Filtros ──────────────────────────────────────────────────────
  aplicarFiltros() {
    const texto = this.buscaTexto.trim().toLowerCase();
    this.ordensFiltradas = this.todasOrdens.filter(os => {
      const matchStatus = !this.filtroStatus || os.status === this.filtroStatus;
      const matchTexto  = !texto || [
        os.equipamento?.patrimonio,
        os.equipamento?.tipoEquipamento?.nome,
        os.tecnicoResponsavel,
        os.descricaoProblema,
        os.solicitante?.nome,
      ].some(v => v?.toLowerCase().includes(texto));
      return matchStatus && matchTexto;
    });
  }

  filtrarPorStatus(valor: string | null) {
    this.filtroStatus = valor;
    this.aplicarFiltros();
  }

  onBuscaChange() {
    this.aplicarFiltros();
  }

  contarPorStatus(valor: string | null) {
    if (!valor) return this.todasOrdens.length;
    return this.todasOrdens.filter(o => o.status === valor).length;
  }

  // ── AutoComplete Equipamentos ─────────────────────────────────────
  buscarEquipamentos(event: any) {
    const q = event.query;
    this.equipmentService.listarTodos(1, 30, q).subscribe({
      next: (res) => { this.equipSugestoes = res.itens || []; },
      error: () => { this.equipSugestoes = []; }
    });
  }

  // ── Modal: Nova OS ────────────────────────────────────────────────
  abrirNovaOS() {
    this.equipamentoNovaOs = null;
    this.novaOsForm.reset();
    this.exibirModalNovaOS = true;
  }

  confirmarNovaOS() {
    if (this.novaOsForm.invalid || !this.equipamentoNovaOs?.id) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um equipamento e descreva o problema.' });
      return;
    }

    const payload = {
      equipamentoId: this.equipamentoNovaOs.id,
      ...this.novaOsForm.value,
      dataPrevisao: this.novaOsForm.value.dataPrevisao
        ? new Date(this.novaOsForm.value.dataPrevisao).toISOString()
        : null,
    };

    this.maintenanceService.criar(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OS Aberta', detail: 'Ordem de serviço criada com sucesso.' });
        this.exibirModalNovaOS = false;
        this.carregarDados();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao criar ordem de serviço.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
      }
    });
  }

  // ── Central de Assistência Premium (Modal Único) ──────────────────
  abrirAssistencia(os: any) {
    this.osSelecionada = os;
    this.statusForm.reset({
      status:             os.status,
      tecnicoResponsavel: os.tecnicoResponsavel || '',
      dataPrevisao:       os.dataPrevisao ? new Date(os.dataPrevisao) : null,
      solucaoAplicada:    os.solucaoAplicada || '',
      valorGasto:         os.valorGasto || null,
    });

    this.exibirModalAssistencia = true;
    this.carregarHistoricoOS(os.id);
  }

  carregarHistoricoOS(osId: number) {
    this.carregandoHistorico = true;
    this.maintenanceService.obterHistorico(osId).subscribe({
      next: (res) => {
        this.historicoOS = res || [];
        this.carregandoHistorico = false;
      },
      error: () => {
        this.historicoOS = [];
        this.carregandoHistorico = false;
      }
    });
  }

  salvarStatus() {
    if (this.statusForm.invalid || !this.osSelecionada) return;

    this.maintenanceService.atualizarStatus(
      this.osSelecionada.id,
      this.statusForm.value
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status atualizado com sucesso na assistência.' });
        this.carregarHistoricoOS(this.osSelecionada.id);
        this.carregarDados();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar ordem de serviço.' });
      }
    });
  }

  fecharAssistencia() {
    this.exibirModalAssistencia = false;
    this.osSelecionada = null;
    this.historicoOS = [];
  }

  // ── Helpers ──────────────────────────────────────────────────────
  formatarStatusLabel(status: string): string {
    const mapa: Record<string, string> = {
      ABERTA:          'Aberta',
      EM_ANDAMENTO:    'Em Andamento',
      AGUARDANDO_PECA: 'Aguardando Peça',
      CONCLUIDA:       'Concluída',
      CANCELADA:       'Cancelada',
    };
    return mapa[status] || status;
  }

  isStatusFinal(status: string) {
    return status === 'CONCLUIDA' || status === 'CANCELADA';
  }

  getEquipamentoLabel(eq: any): string {
    if (!eq) return '';
    return `${eq.patrimonio} — ${eq.tipoEquipamento?.nome || ''} ${eq.marca?.nome ? '(' + eq.marca.nome + ')' : ''}`.trim();
  }

  diasAberta(dataAbertura: string): number {
    if (!dataAbertura) return 0;
    const diff = Date.now() - new Date(dataAbertura).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  isAtrasada(os: any): boolean {
    if (!os.dataPrevisao || this.isStatusFinal(os.status)) return false;
    return new Date(os.dataPrevisao) < new Date();
  }
}
