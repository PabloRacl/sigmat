/**
 * [Estado Atual]: Componente "Smart" (Container) que gerencia o estado da listagem, paginação, filtros e operações em massa de Equipamentos.
 * [Dependências Técnicas]:
 *   - Services: EquipmentService, SettingsService, TransfersService, MaintenanceService, DashboardService, AuthService, ReportsService, UploadService, PdfService
 *   - Subcomponents: EquipmentFormComponent, EquipmentTimelineComponent, EquipmentDetailsComponent
 * [Histórico de Modificações]:
 *   - Migrado para a estrutura de pastas Domain-Driven (/feature./equipamentos/lista-equipamentos).
 *   - Ajustadas importações absolutas/relativas de serviços globais do /core.
 *   - Adicionado cabeçalho de contexto arquitetural de alta eficiência de tokens.
 * [Regras de Negócio Imutáveis]:
 *   - Delegação de operações de persistência e chamadas de API estritamente para os serviços injetados.
 *   - Controle de permissão com base em perfil de usuário (ehAdmin).
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { forkJoin, of, catchError, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { MaintenanceService } from '../../../nucleo/servicos/manutencao.service';
import { DashboardService } from '../../../nucleo/servicos/painel.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { ReportsService } from '../../../nucleo/servicos/relatorios.service';

// PrimeNG 18 Modules
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UploadService } from '../../../nucleo/servicos/carregamento.service';
import { PdfService } from '../../../nucleo/servicos/pdf.service';

// Subcomponents
import { EquipmentFormComponent } from '../formulario/formulario-equipamento.component';
import { EquipmentTimelineComponent } from '../linha-do-tempo/linha-do-tempo-equipamento.component';
import { EquipmentDetailsComponent } from '../detalhes/detalhes-equipamento.component';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { Equipamento, TipoEquipamento, StatusEquipamento, Disponibilidade, Secao, Marca } from '../../../nucleo/interfaces/equipamento.interface';
import { IndicadorStatusComponent } from '../../../componentes/indicador-status/indicador-status.component';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';
import { FiltroLateralComponent, FiltroConfig } from '../../../componentes/filtro-lateral/filtro-lateral.component';
import { TabelaScrollComponent } from '../../../componentes/tabela-scroll/tabela-scroll.component';

@Component({
  selector: 'app-lista-equipamentos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    Textarea,
    DatePickerModule,
    ToastModule,
    TooltipModule,
    TableModule,
    EquipmentFormComponent,
    EquipmentTimelineComponent,
    EquipmentDetailsComponent,
    LayoutPaginaComponent,
    IndicadorStatusComponent,
    EstadoVazioComponent,
    ConfirmDialogModule,
    FiltroLateralComponent,
    TabelaScrollComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lista-equipamentos.component.html',
  styleUrls: ['./lista-equipamentos.component.scss']
})
export class EquipmentListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private equipmentService = inject(EquipmentService);
  private configService = inject(SettingsService);
  private transfersService = inject(TransfersService);
  private maintenanceService = inject(MaintenanceService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  public uploadService = inject(UploadService);
  private pdfService = inject(PdfService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  /** Indica se a tela atual é mobile (≤ 767px) */
  isMobile = false;

  get ehAdmin(): boolean {
    const perfil = this.authService.getUsuario()?.perfil;
    return perfil === 'ADMIN_DTEC' || perfil === 'DIRETORIA';
  }

  equipamentos: Equipamento[] = [];
  totalRecords = 0;
  rows = 20;
  rowsPerPage = [20, 50, 100];
  first = 0;
  carregando = true;
  filtroGlobal = '';

  // New handler for pagination events (page or size change)
  onPageChange(event: { first: number, rows: number }) {
    // PrimeNG passes first, rows, page, pageCount
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    // Recarregar dados usando o novo tamanho de pÃ¡gina
    this.loadEquipamentosLazy({ first: this.first, rows: this.rows, sortField: null, sortOrder: null, filters: {} });
  }

  ready = true; // Restaurando para true por padrão para evitar o loading-init que não existia

  // Modelos do Filtro
  exibirFiltrosAvancados = false;
  modeloFiltros: Record<string, any> = {};
  configFiltros: FiltroConfig[] = [];

  // Estatísticas para os cards
  stats: Record<string, number> = { total: 0, ativos: 0, manutencao: 0, emprestados: 0 };

  // Contagem filtrada
  totalFiltrado: number | null = null;
  contandoFiltro = false;

  // Seleção e Ações em Massa
  selecionados: Equipamento[] = [];
  cestaAberta = false;

  constructor() {
    this.transferenciaMassaForm = this.fb.group({
      destinoId: [null, Validators.required],
      observacao: [''],
      disponibilidadeId: [null, Validators.required],
      solicitante: [null],
      dataSolicitacao: [null],
      dataRetornoEmprestimo: [null],
    });

    this.formMassa = this.fb.group({
      statusId: [null],
      disponibilidadeId: [null],
      secaoId: [null],
      tipoAquisicaoId: [null],
      observacao: ['']
    });

    this.manutencaoForm = this.fb.group({
      descricaoProblema: ['', Validators.required],
      tecnicoResponsavel: [''],
      dataPrevisao: [null],
      statusId: [null]
    });
  }

  get isEmprestimo(): boolean {
    const dispId = this.transferenciaMassaForm.get('disponibilidadeId')?.value;
    const disp = this.disponibilidades.find(d => d.id === dispId);
    return disp?.nome === 'EMPRESTIMO';
  }


  get isCarga(): boolean {
    const dispId = this.transferenciaMassaForm.get('disponibilidadeId')?.value;
    const disp = this.disponibilidades.find(d => d.id === dispId);
    return disp?.nome === 'CARGA';
  }

  ngOnInit(): void {
    // Detecta breakpoint mobile para desabilitar colunas congeladas
    this.breakpointObserver.observe('(max-width: 767px)')
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    this.carregarDadosAuxiliares();
    // Subscribe to status changes to set default forecast date
    this.manutencaoForm.get('statusId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
      // Example: set forecast 7 days from now for statuses involving 'PEÃ‡A'
        if (status && status.toString().toUpperCase().includes('PEÃ‡A')) {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          this.manutencaoForm.patchValue({ dataPrevisao: date });
        }
        // Record history entry
        this.manutencaoHistory.push({
          status: status ? status.toString() : '',
          previsao: this.manutencaoForm.get('dataPrevisao')?.value || null,
          timestamp: new Date()
        });
    });
    this.carregarStats();
    // A carga inicial serÃ¡ disparada pelo onLazyLoad da tabela
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarDadosAuxiliares() {
    this.configService.listarDiretorias().subscribe(res => { this.diretorias = res; this.atualizarConfigFiltros(); });
    this.configService.listarBatalhoes().subscribe(res => { this.batalhoes = res; this.atualizarConfigFiltros(); });
    this.configService.listarTipos().subscribe(res => { this.tipos = res; this.atualizarConfigFiltros(); });
    this.configService.listarStatus().subscribe(res => { this.status = res; this.atualizarConfigFiltros(); });
    this.configService.listarDisponibilidades().subscribe(res => { this.disponibilidades = res; this.atualizarConfigFiltros(); });
    this.configService.listarTiposAquisicao().subscribe(res => { this.tiposAquisicao = res; });
    this.configService.listarSecoes().subscribe(res => { this.secoes = res; this.atualizarConfigFiltros(); });
    this.configService.listarMarcas().subscribe(res => { this.marcas = res; this.atualizarConfigFiltros(); });
  }

  atualizarConfigFiltros() {
    this.configFiltros = [
      { key: 'diretoriaId', label: 'Diretoria (Cascata)', tipo: 'select', opcoes: this.diretorias as unknown as Record<string, unknown>[], optionLabel: 'sigla', optionValue: 'id', placeholder: 'Todas as Diretorias' },
      { key: 'batalhaoId', label: 'Batalhão (Cascata)', tipo: 'select', opcoes: this.batalhoes as unknown as Record<string, unknown>[], optionLabel: 'sigla', optionValue: 'id', placeholder: 'Todos os Batalhões' },
      { key: 'tipoId', label: 'Tipo de Equipamento', tipo: 'select', opcoes: this.tipos as unknown as Record<string, unknown>[], optionLabel: 'nome', optionValue: 'id', placeholder: 'Todos os Tipos' },
      { key: 'statusId', label: 'Status', tipo: 'select', opcoes: this.status as unknown as Record<string, unknown>[], optionLabel: 'nome', optionValue: 'id', placeholder: 'Todos os Status' },
      { key: 'disponibilidadeId', label: 'Disponibilidade', tipo: 'select', opcoes: this.disponibilidades as unknown as Record<string, unknown>[], optionLabel: 'nome', optionValue: 'id', placeholder: 'Todas' },
      { key: 'secaoId', label: 'Seção Atual', tipo: 'select', opcoes: this.secoes as unknown as Record<string, unknown>[], optionLabel: 'sigla', optionValue: 'id', placeholder: 'Todas as Seções' },
      { key: 'marcaId', label: 'Marca', tipo: 'select', opcoes: this.marcas as unknown as Record<string, unknown>[], optionLabel: 'nome', optionValue: 'id', placeholder: 'Todas as Marcas' },
      { key: 'patrimonio', label: 'Patrimônio', tipo: 'text', placeholder: 'Ex: S-PAT-123' },
      { key: 'sei', label: 'Nº SEI', tipo: 'text', placeholder: 'Ex: 00123.000...' },
      { key: 'numeroSerie', label: 'Nº de Série', tipo: 'text', placeholder: 'Ex: ABC12345' },
      { key: 'dataAquisicao', label: 'Data de Aquisição', tipo: 'date', placeholder: 'dd/mm/aaaa' },
      { key: 'observacao', label: 'Observação', tipo: 'text', placeholder: 'Buscar em observações...' }
    ];
  }

  carregarStats() {
    this.dashboardService.obterEstatisticas().subscribe(res => {
      this.stats = res.resumo;
    });
  }

  filtrarPorStatusNome(nome: string) {
    const status = this.status.find(s => s.nome?.toUpperCase() === nome.toUpperCase());
    if (!status) return;
    this.modeloFiltros['statusId'] = status.id;
    this.exibirFiltrosAvancados = true;
    this.pesquisar();
  }

  carregarEquipamentos(page: number, limit: number, search: string = '') {
    this.carregando = true;

    const filtrosAtivos: Record<string, unknown> = {};
    for (const key in this.modeloFiltros) {
      if (this.modeloFiltros[key] !== null && this.modeloFiltros[key] !== '') {
        if (this.modeloFiltros[key] instanceof Date) {
          const dt = this.modeloFiltros[key] as Date;
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          filtrosAtivos[key] = `${yyyy}-${mm}-${dd}`;
        } else {
          filtrosAtivos[key] = this.modeloFiltros[key];
        }
      }
    }

    this.equipmentService.listarTodos(page, limit, search, filtrosAtivos).subscribe({
      next: (res) => {
        this.equipamentos = res.itens || [];
        this.totalRecords = res.total || 0;
        this.carregando = false;
        this.atualizarStatsFiltro(this.totalRecords);
      },
      error: (err) => {
        console.error('Erro ao carregar:', err);
        this.carregando = false;
      }
    });
  }

  loadEquipamentosLazy(event: TableLazyLoadEvent) {
    if (!event || event.rows == null || event.first == null) return;
    const page = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.carregarEquipamentos(page, this.rows, this.filtroGlobal);
  }

  pesquisar() {
    this.first = 0;
    this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
  }

  limparFiltros() {
    this.filtroGlobal = '';
    this.modeloFiltros = {};
    this.first = 0;
    this.selecionados = [];
    this.cestaAberta = false;
    this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
    this.carregarStats();
  }

  get filtroAtivo(): boolean {
    const temModelo = Object.values(this.modeloFiltros).some(val => val !== null && val !== '');
    return temModelo || !!this.filtroGlobal;
  }

  atualizarStatsFiltro(total?: number) {
    if (!this.filtroAtivo) {
      this.totalFiltrado = null;
      this.contandoFiltro = false;
      return;
    }

    if (total !== undefined) {
      this.totalFiltrado = total;
      this.contandoFiltro = false;
      return;
    }

    // Caso precise forçar uma atualização manual sem ter o total em mãos
    this.contandoFiltro = true;
    const filtrosAtivos: Record<string, unknown> = {};
    // Para simplificar na contagem rápida
    ['diretoriaId', 'batalhaoId', 'tipoId', 'statusId', 'disponibilidadeId', 'secaoId'].forEach(key => {
      if (this.modeloFiltros[key]) filtrosAtivos[key] = this.modeloFiltros[key];
    });

    this.equipmentService.listarTodos(1, 1, this.filtroGlobal, filtrosAtivos).subscribe({
      next: (res) => {
        this.totalFiltrado = res.total ?? 0;
        this.contandoFiltro = false;
      },
      error: () => this.contandoFiltro = false
    });
  }

  // Modais e Auxiliares (mantidos como estavam originalmente)
  status: StatusEquipamento[] = [];
  // History of maintenance actions
  manutencaoHistory: { status: string; previsao: Date | null; timestamp: Date }[] = [];
  disponibilidades: Disponibilidade[] = [];
  diretorias: any[] = [];
  batalhoes: any[] = [];
  secoes: Secao[] = [];
  tiposAquisicao: Record<string, any>[] = [];
  tipos: TipoEquipamento[] = [];
  marcas: Marca[] = [];
  exibirModal = false;
  exibirModalTimeline = false;
  exibirModalDetalhes = false;
  equipamentoSelecionado: Equipamento | null = null;
  exibirModalMassa = false;
  formMassa: FormGroup;
  exibirModalTransferenciaMassa = false;
  transferenciaMassaForm: FormGroup;
  exibirModalManutencao = false;
  manutencaoForm: FormGroup;

  estaSelecionado(id: number): boolean { return this.selecionados.some(eq => eq.id === id); }
  limparSelecao() { this.selecionados = []; this.cestaAberta = false; }
  removerDaSelecao(eq: Equipamento) { this.selecionados = this.selecionados.filter(item => item.id !== eq.id); if (this.selecionados.length === 0) this.cestaAberta = false; }
  

  abrirNovo() { this.equipamentoSelecionado = null; this.exibirModal = true; }
  editar(eq: Equipamento) { this.equipamentoSelecionado = eq; this.exibirModal = true; }
  onSaved() { this.carregarEquipamentos(1, this.rows, this.filtroGlobal); this.carregarStats(); }
  removerEquipamento(eq: Equipamento) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir o equipamento ${eq.patrimonio}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.equipmentService.remover(eq.id).subscribe({
          next: (res: any) => {
            if (res && res.dadosNovos && res.dadosNovos._acao === 'DELETE') {
              this.messageService.add({ severity: 'info', summary: 'Aprovação Solicitada', detail: 'A exclusão do equipamento foi enviada para o DTEC.', life: 5000 });
            } else {
              this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Equipamento removido do sistema.' });
              this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
              this.carregarStats();
            }
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir equipamento.' })
        });
      }
    });
  }
  verDetalhes(eq: Equipamento) { this.equipamentoSelecionado = eq; this.exibirModalDetalhes = true; }
  verTimeline(eq: Equipamento) { this.equipamentoSelecionado = eq; this.exibirModalTimeline = true; }

  transferirEquipamento(eq: Equipamento) {
    this.selecionados = [eq];
    this.abrirTransferenciaMassa();
  }

  enviarParaManutencao(eq: Equipamento) {
    this.selecionados = [eq];
    this.abrirModalManutencao();
  }

  abrirTransferenciaMassa() { if (this.selecionados.length === 0) return; this.transferenciaMassaForm.reset(); this.exibirModalTransferenciaMassa = true; }

// Abre modal de manutenção para os equipamentos selecionados
abrirModalManutencao() {
  if (this.selecionados.length === 0) return;
  this.manutencaoForm.reset();
  this.exibirModalManutencao = true;
}
  confirmarTransferenciaMassa() {
    if (this.transferenciaMassaForm.invalid) return;
    const ids = this.selecionados.map(i => i.id);
    const form = this.transferenciaMassaForm.value;
    const destinoId = form.destinoId;
    const observacao = form.observacao;
    const disponibilidadeId = form.disponibilidadeId;
    const solicitante = form.solicitante;
    const dataSolicitacao = form.dataSolicitacao ? form.dataSolicitacao.toISOString() : undefined;
    const dataRetornoEmprestimo = form.dataRetornoEmprestimo ? form.dataRetornoEmprestimo.toISOString() : undefined;
    this.transfersService.solicitarMassa(
      ids,
      destinoId,
      observacao,
      disponibilidadeId,
      solicitante,
      dataSolicitacao,
      dataRetornoEmprestimo
    ).subscribe({
      next: () => {
        if (this.ehAdmin) {
          this.reportsService.registrarLog('TRANSFERENCIA_MASSA_DIRETA', {
            usuario: this.authService.getUsuario()?.nome,
            equipamentosIds: ids,
            destinoId: destinoId,
            mensagem: 'Transferência processada diretamente sem aprovação (Admin)'
          }).subscribe({ error: () => {} });
        }
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Transferência em massa solicitada.' });
        this.exibirModalTransferenciaMassa = false;
        this.limparSelecao();
        this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao solicitar transferência.' })
    });
  }
  recarregar() {
    this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
    this.carregarStats();
  }

  abrirModalEdicaoMassa() { if (this.selecionados.length === 0) return; this.formMassa.reset(); this.exibirModalMassa = true; }
  confirmarEdicaoMassa() {
    if (this.formMassa.invalid) return;
    const ids = this.selecionados.map(i => i.id);
    this.equipmentService.atualizarEmMassa(ids, this.formMassa.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Equipamentos atualizados em massa.' });
        this.exibirModalMassa = false;
        this.limparSelecao();
        this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar equipamentos.' })
    });
  }
    // Confirma criação de ordem de serviço em massa para os equipamentos selecionados
    confirmarManutencao() {
      if (this.manutencaoForm.invalid) return;
      const ids = this.selecionados.map(i => i.id);
      this.maintenanceService.criarMassa(ids, this.manutencaoForm.value).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ordem de serviço criada para os equipamentos selecionados.' });
          this.exibirModalManutencao = false;
          this.limparSelecao();
          this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao enviar para manutenção.' })
      });
    }

  exportarExcelMassa() {
    if (this.selecionados.length === 0) return;
    // Exportação simples em CSV para satisfazer a função de Excel
    const header = 'Patrimonio,Tipo,Marca,Modelo,Serie,Status,Secao\n';
    const rows = this.selecionados.map(e => 
      `${e.patrimonio},${e.tipoEquipamento?.nome},${e.marca?.nome},${e.modelo?.nome || ''},${e.numeroSerie},${e.status?.nome},${e.secao?.sigla}`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `exportacao_atlas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Arquivo CSV gerado com sucesso.' });
  }

  async imprimirEtiquetasMassa() {
    if (this.selecionados.length === 0) return;
    const success = await this.pdfService.gerarEtiquetas(this.selecionados);
    if (success) {
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Etiquetas geradas com sucesso.' });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao gerar etiquetas.' });
    }
  }

  async imprimirEtiquetaUnica(eq: Equipamento) {
    const success = await this.pdfService.gerarEtiquetas([eq]);
    const patrimonioDisplay = eq.patrimonio ?? eq.id ?? 'desconhecido';
    if (success) {
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Etiqueta do patrimônio ${patrimonioDisplay} gerada.` });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: `Falha ao gerar etiqueta do patrimônio ${patrimonioDisplay}.` });
    }
  }

  obterDestinoSigla(): string {
    const destinoId = this.transferenciaMassaForm.get('destinoId')?.value;
    if (!destinoId) return '';
    const sec = this.secoes.find(s => s.id === destinoId);
    return sec ? sec.sigla : '';
  }

  obterDestinoNome(): string {
    const destinoId = this.transferenciaMassaForm.get('destinoId')?.value;
    if (!destinoId) return '';
    const sec = this.secoes.find(s => s.id === destinoId);
    return sec ? sec.nome : '';
  }
}


