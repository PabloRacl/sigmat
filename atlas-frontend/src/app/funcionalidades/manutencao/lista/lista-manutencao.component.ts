import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaintenanceService } from '../../../nucleo/servicos/manutencao.service';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { HistoricoOs } from '../../../nucleo/servicos/manutencao.service';
import { Subject, takeUntil } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';
import { FiltroLateralComponent, FiltroConfig } from '../../../componentes/filtro-lateral/filtro-lateral.component';

export interface EquipamentoManutencao {
  id: number;
  patrimonio: string;
  tipoEquipamento?: { nome: string };
  marca?: { nome: string };
  modelo?: { nome: string };
  secao?: { id: number; sigla: string; nome?: string };
}

export interface OrdemServico {
  id: number;
  status: string;
  equipamento?: EquipamentoManutencao;
  tecnicoResponsavel?: string;
  descricaoProblema?: string;
  solicitante?: { nome: string };
  dataAbertura: string;
  dataPrevisao?: string;
  solucaoAplicada?: string;
  valorGasto?: number;
  [key: string]: unknown;
}

@Component({
  selector: 'app-lista-manutencao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    Textarea,
    ToastModule,
    InputNumberModule,
    TooltipModule,
    DatePickerModule,
    AutoCompleteModule,
    LayoutPaginaComponent,
    EstadoVazioComponent,
    FiltroLateralComponent
  ],
  providers: [MessageService],
  templateUrl: './lista-manutencao.component.html',
  styleUrls: ['./lista-manutencao.component.scss']
})
export class MaintenanceListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
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
  todasOrdens: OrdemServico[] = [];
  ordensFiltradas: OrdemServico[] = [];
  carregando = true;
  buscaTexto = '';

  // ── Filtro por Status ─────────────────────────────────────────────
  filtroStatus: string | null = null;
  exibirFiltrosAvancados = false;
  filtroAtivo = false;
  modeloFiltros: Record<string, any> = {};

  configFiltros: FiltroConfig[] = [
    { key: 'osId', label: 'Número da OS (#)', tipo: 'text', placeholder: 'Ex: 15' },
    { key: 'equipamento', label: 'Equipamento (Patrimônio, Marca...)', tipo: 'text', placeholder: 'Ex: HT Motorola' },
    { key: 'descricaoProblema', label: 'Problema Relatado', tipo: 'text', placeholder: 'Ex: Tela quebrada' },
    { key: 'tecnicoResponsavel', label: 'Técnico Responsável', tipo: 'text', placeholder: 'Ex: SD Silva' },
    { key: 'solicitante', label: 'Solicitante', tipo: 'text', placeholder: 'Ex: Sgt Oliveira' },
    { key: 'dataAberturaInicio', label: 'Abertas a partir de', tipo: 'date' },
    { key: 'dataAberturaFim', label: 'Abertas até', tipo: 'date' },
    { key: 'dataPrevisaoInicio', label: 'Previsão a partir de', tipo: 'date' },
    { key: 'dataPrevisaoFim', label: 'Previsão até', tipo: 'date' },
    { key: 'status', label: 'Status da OS', tipo: 'select', opcoes: [
      { label: 'Todos os Status', value: null },
      { label: 'Aberta', value: 'ABERTA' },
      { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
      { label: 'Aguardando Peça', value: 'AGUARDANDO_PECA' },
      { label: 'Concluída', value: 'CONCLUIDA' },
      { label: 'Cancelada', value: 'CANCELADA' }
    ]}
  ];

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
  equipSugestoes: EquipamentoManutencao[] = [];
  equipamentoNovaOs: EquipamentoManutencao | null = null;

  // ── Modal: Assistência Premium (3 Colunas) ───────────────────────
  exibirModalAssistencia = false;
  modoEdicao = false;
  statusForm: FormGroup;
  osSelecionada: OrdemServico | null = null;
  historicoOS: HistoricoOs[] = [];
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
    this.statusForm.get('status')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
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
          const osAtualizada = this.todasOrdens.find(o => o.id === this.osSelecionada?.id);
          if (osAtualizada) {
            this.osSelecionada = osAtualizada;
          }
        }
      },
      error: () => {
        // toast removido pois o interceptor global já exibe a mensagem de erro
        this.carregando = false;
      }
    });
  }

  // ── Filtros ──────────────────────────────────────────────────────
  aplicarFiltros() {
    const texto = this.buscaTexto.trim().toLowerCase();

    // Atualiza a flag de filtro ativo baseado no lateral
    this.filtroAtivo = Object.values(this.modeloFiltros).some(val => val !== null && val !== '');

    this.ordensFiltradas = this.todasOrdens.filter(os => {
      // 1. Filtro rápido de status (via cards superiores)
      const matchStatusRapido = !this.filtroStatus || os.status === this.filtroStatus;
      
      // 2. Busca de texto (barra premium)
      const matchTexto = !texto || [
        os.id?.toString(),
        os.equipamento?.patrimonio,
        os.equipamento?.tipoEquipamento?.nome,
        os.equipamento?.marca?.nome,
        os.equipamento?.modelo?.nome,
        os.equipamento?.secao?.sigla,
        os.equipamento?.secao?.nome,
        os.tecnicoResponsavel,
        os.descricaoProblema,
        os.solicitante?.nome,
        this.formatarStatusLabel(os.status),
        this.diasAberta(os.dataAbertura).toString(),
        this.formatDate(os.dataAbertura),
        this.formatDate(os.dataPrevisao)
      ].some(v => v?.toLowerCase().includes(texto));

      // 3. Filtros Avançados (Lateral)
      let matchAvancado = true;
      if (this.filtroAtivo) {
        if (this.modeloFiltros['osId'] && os.id?.toString() !== this.modeloFiltros['osId'].trim()) {
          matchAvancado = false;
        }
        if (this.modeloFiltros['equipamento']) {
          const termoEquip = this.modeloFiltros['equipamento'].toLowerCase();
          const equipMatch = [
            os.equipamento?.patrimonio,
            os.equipamento?.tipoEquipamento?.nome,
            os.equipamento?.marca?.nome,
            os.equipamento?.modelo?.nome,
            os.equipamento?.secao?.sigla
          ].some(v => v?.toLowerCase().includes(termoEquip));
          if (!equipMatch) matchAvancado = false;
        }
        if (this.modeloFiltros['descricaoProblema'] && (!os.descricaoProblema || !os.descricaoProblema.toLowerCase().includes(this.modeloFiltros['descricaoProblema'].toLowerCase()))) {
          matchAvancado = false;
        }
        if (this.modeloFiltros['status'] && os.status !== this.modeloFiltros['status']) {
          matchAvancado = false;
        }
        if (this.modeloFiltros['tecnicoResponsavel'] && (!os.tecnicoResponsavel || !os.tecnicoResponsavel.toLowerCase().includes(this.modeloFiltros['tecnicoResponsavel'].toLowerCase()))) {
          matchAvancado = false;
        }
        if (this.modeloFiltros['solicitante'] && (!os.solicitante?.nome || !os.solicitante.nome.toLowerCase().includes(this.modeloFiltros['solicitante'].toLowerCase()))) {
          matchAvancado = false;
        }
        
        if (this.modeloFiltros['dataAberturaInicio'] && os.dataAbertura) {
          const dataAbertura = new Date(os.dataAbertura);
          const inicio = new Date(this.modeloFiltros['dataAberturaInicio']);
          inicio.setHours(0, 0, 0, 0); // Zera o comeco do dia
          if (dataAbertura < inicio) matchAvancado = false;
        }
        if (this.modeloFiltros['dataAberturaFim'] && os.dataAbertura) {
          const dataAbertura = new Date(os.dataAbertura);
          // Adicionar 23:59:59 ao dia de fim
          const fim = new Date(this.modeloFiltros['dataAberturaFim']);
          fim.setHours(23, 59, 59, 999);
          if (dataAbertura > fim) matchAvancado = false;
        }
        if (this.modeloFiltros['dataPrevisaoInicio'] && os.dataPrevisao) {
          const dataPrevisao = new Date(os.dataPrevisao);
          const inicio = new Date(this.modeloFiltros['dataPrevisaoInicio']);
          inicio.setHours(0, 0, 0, 0);
          if (dataPrevisao < inicio) matchAvancado = false;
        } else if (this.modeloFiltros['dataPrevisaoInicio'] && !os.dataPrevisao) {
          matchAvancado = false;
        }
        if (this.modeloFiltros['dataPrevisaoFim'] && os.dataPrevisao) {
          const dataPrevisao = new Date(os.dataPrevisao);
          const fim = new Date(this.modeloFiltros['dataPrevisaoFim']);
          fim.setHours(23, 59, 59, 999);
          if (dataPrevisao > fim) matchAvancado = false;
        } else if (this.modeloFiltros['dataPrevisaoFim'] && !os.dataPrevisao) {
          matchAvancado = false;
        }
      }

      return matchStatusRapido && matchTexto && matchAvancado;
    });
  }

  filtrarPorStatus(valor: string | null) {
    this.filtroStatus = valor;
    this.aplicarFiltros();
  }

  pesquisarAvancado() {
    // Sincroniza o status card superior com o status do filtro avançado se houver
    if (this.modeloFiltros['status'] !== undefined) {
      this.filtroStatus = this.modeloFiltros['status'];
    }
    this.aplicarFiltros();
    this.exibirFiltrosAvancados = false; // Fecha a gaveta após aplicar
  }

  onBuscaChange() {
    this.aplicarFiltros();
  }

  contarPorStatus(valor: string | null) {
    if (!valor) return this.todasOrdens.length;
    return this.todasOrdens.filter(o => o.status === valor).length;
  }

  // ── AutoComplete Equipamentos ─────────────────────────────────────
  buscarEquipamentos(event: Record<string, any>) {
    const q = event['query'] as string;
    this.equipmentService.listarTodos(1, 30, q).subscribe({
      next: (res) => { this.equipSugestoes = (res.itens || []) as unknown as EquipamentoManutencao[]; },
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
        // toast removido pois o interceptor global já exibe a mensagem de erro
      }
    });
  }

  // ── Central de Assistência Premium (Modal Único) ──────────────────
  abrirAssistencia(os: OrdemServico, modoEdicao: boolean = false) {
    this.osSelecionada = os;
    this.modoEdicao = modoEdicao;
    this.statusForm.reset({
      status:             os.status,
      tecnicoResponsavel: os.tecnicoResponsavel || '',
      dataPrevisao:       os.dataPrevisao ? new Date(os.dataPrevisao) : null,
      solucaoAplicada:    os.solucaoAplicada || '',
      valorGasto:         os.valorGasto || null,
    });

    if (this.ehAdmin && modoEdicao) {
      this.statusForm.enable();
    } else {
      this.statusForm.disable();
    }

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
        this.carregarHistoricoOS(this.osSelecionada!.id);
        this.carregarDados();
      },
      error: () => {
        // toast removido pois o interceptor global já exibe a mensagem de erro
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

  getEquipamentoLabel(eq: EquipamentoManutencao | undefined): string {
    if (!eq) return '';
    return `${eq.patrimonio} — ${eq.tipoEquipamento?.nome || ''} ${eq.marca?.nome ? '(' + eq.marca.nome + ')' : ''}`.trim();
  }

  diasAberta(dataAbertura: string): number {
    if (!dataAbertura) return 0;
    const diff = Date.now() - new Date(dataAbertura).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  isAtrasada(os: OrdemServico): boolean {
    if (!os.dataPrevisao || this.isStatusFinal(os.status)) return false;
    return new Date(os.dataPrevisao) < new Date();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


