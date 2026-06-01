/**
 * [Estado Atual]: Componente "Smart" (Container) que gerencia o estado da listagem, paginação, filtros e operações em massa de Equipamentos.
 * [Dependências Técnicas]:
 *   - Services: EquipmentService, SettingsService, TransfersService, MaintenanceService, DashboardService, AuthService, ReportsService, UploadService, PdfService
 *   - Subcomponents: EquipmentFormComponent, EquipmentTimelineComponent, EquipmentDetailsComponent
 * [Histórico de Modificações]:
 *   - Migrado para a estrutura de pastas Domain-Driven (/features/equipment/equipment-list).
 *   - Ajustadas importações absolutas/relativas de serviços globais do /core.
 *   - Adicionado cabeçalho de contexto arquitetural de alta eficiência de tokens.
 * [Regras de Negócio Imutáveis]:
 *   - Delegação de operações de persistência e chamadas de API estritamente para os serviços injetados.
 *   - Controle de permissão com base em perfil de usuário (ehAdmin).
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { forkJoin, of, catchError, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipmentService } from '../../../core/services/equipment.service';
import { SettingsService } from '../../../core/services/settings.service';
import { TransfersService } from '../../../core/services/transfers.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportsService } from '../../../core/services/reports.service';

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
import { UploadService } from '../../../core/services/upload.service';
import { PdfService } from '../../../core/services/pdf.service';

// Subcomponents
import { EquipmentFormComponent } from '../equipment-form/equipment-form.component';
import { EquipmentTimelineComponent } from '../equipment-timeline/equipment-timeline.component';
import { EquipmentDetailsComponent } from '../equipment-details/equipment-details.component';

@Component({
  selector: 'app-equipment-list',
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
    EquipmentDetailsComponent
  ],
  providers: [MessageService],
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.scss']
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
  public uploadService = inject(UploadService);
  private pdfService = inject(PdfService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  get ehAdmin(): boolean {
    const perfil = this.authService.getUsuario()?.perfil;
    return perfil === 'ADMIN_DTEC' || perfil === 'DIRETORIA';
  }

  equipamentos: any[] = [];
  totalRecords = 0;
  rows = 20;
  rowsPerPage = [20, 50, 100];
  first = 0;
  carregando = true;
  filtroGlobal = '';

  // New handler for pagination events (page or size change)
  onPageChange(event: any) {
    // PrimeNG passes first, rows, page, pageCount
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    // Recarregar dados usando o novo tamanho de pÃ¡gina
    this.loadEquipamentosLazy({ first: this.first, rows: this.rows, sortField: null, sortOrder: null, filters: {} });
  }

  ready = true; // Restaurando para true por padrÃ£o para evitar o loading-init que nÃ£o existia

  // Filtros AvanÃ§ados
  filtroTipo: number | null = null;
  filtroStatus: number | null = null;
  filtroDisponibilidade: number | null = null;
  filtroSecao: number | null = null;
  filtroMarca: number | null = null;
  filtroPatrimonio: string = '';
  filtroSei: string = '';
  filtroNumeroSerie: string = '';
  filtroDataAquisicao: Date | null = null;
  filtroObservacao: string = '';
  exibirFiltrosAvancados = false;

  // EstatÃ­sticas para os cards
  stats: any = { total: 0, ativos: 0, manutencao: 0, emprestados: 0 };

  // Contagem filtrada
  totalFiltrado: number | null = null;
  contandoFiltro = false;

  // SeleÃ§Ã£o e AÃ§Ãµes em Massa
  selecionados: any[] = [];
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
    this.carregarDadosAuxiliares();
    // Subscribe to status changes to set default forecast date
    this.manutencaoForm.get('statusId')?.valueChanges.subscribe(status => {
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
    this.configService.listarTipos().subscribe(res => this.tipos = res);
    this.configService.listarStatus().subscribe(res => this.status = res);
    this.configService.listarDisponibilidades().subscribe(res => this.disponibilidades = res);
    this.configService.listarTiposAquisicao().subscribe(res => this.tiposAquisicao = res);
    this.configService.listarSecoes().subscribe(res => this.secoes = res);
    this.configService.listarMarcas().subscribe(res => this.marcas = res);
  }

  carregarStats() {
    this.dashboardService.obterEstatisticas().subscribe(res => {
      this.stats = res.resumo;
    });
  }

  filtrarPorStatusNome(nome: string) {
    const status = this.status.find(s => s.nome?.toUpperCase() === nome.toUpperCase());
    if (!status) return;
    this.filtroStatus = status.id;
    this.exibirFiltrosAvancados = true;
    this.pesquisar();
  }

  carregarEquipamentos(page: number, limit: number, search: string = '') {
    this.carregando = true;

    const filtrosAtivos: any = {};
    if (this.filtroTipo) filtrosAtivos.tipoId = this.filtroTipo;
    if (this.filtroStatus) filtrosAtivos.statusId = this.filtroStatus;
    if (this.filtroDisponibilidade) filtrosAtivos.disponibilidadeId = this.filtroDisponibilidade;
    if (this.filtroSecao) filtrosAtivos.secaoId = this.filtroSecao;
    if (this.filtroMarca) filtrosAtivos.marcaId = this.filtroMarca;
    if (this.filtroPatrimonio) filtrosAtivos.patrimonio = this.filtroPatrimonio;
    if (this.filtroSei) filtrosAtivos.sei = this.filtroSei;
    if (this.filtroNumeroSerie) filtrosAtivos.numeroSerie = this.filtroNumeroSerie;
    if (this.filtroObservacao) filtrosAtivos.observacao = this.filtroObservacao;
    if (this.filtroDataAquisicao) filtrosAtivos.dataAquisicao = this.filtroDataAquisicao.toISOString();

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
    this.filtroTipo = null;
    this.filtroStatus = null;
    this.filtroDisponibilidade = null;
    this.filtroSecao = null;
    this.filtroMarca = null;
    this.filtroPatrimonio = '';
    this.filtroSei = '';
    this.filtroNumeroSerie = '';
    this.filtroDataAquisicao = null;
    this.filtroObservacao = '';
    this.first = 0;
    this.selecionados = [];
    this.cestaAberta = false;
    this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
    this.carregarStats();
  }

  get filtroAtivo(): boolean {
    return !!(
      this.filtroTipo || this.filtroStatus || this.filtroDisponibilidade || 
      this.filtroSecao || this.filtroGlobal || this.filtroMarca || 
      this.filtroPatrimonio || this.filtroSei || this.filtroNumeroSerie || 
      this.filtroDataAquisicao || this.filtroObservacao
    );
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

    // Caso precise forÃ§ar uma atualizaÃ§Ã£o manual sem ter o total em mÃ£os
    this.contandoFiltro = true;
    const filtrosAtivos: any = {};
    if (this.filtroTipo) filtrosAtivos.tipoId = this.filtroTipo;
    if (this.filtroStatus) filtrosAtivos.statusId = this.filtroStatus;
    if (this.filtroDisponibilidade) filtrosAtivos.disponibilidadeId = this.filtroDisponibilidade;
    if (this.filtroSecao) filtrosAtivos.secaoId = this.filtroSecao;

    this.equipmentService.listarTodos(1, 1, this.filtroGlobal, filtrosAtivos).subscribe({
      next: (res) => {
        this.totalFiltrado = res.total ?? 0;
        this.contandoFiltro = false;
      },
      error: () => this.contandoFiltro = false
    });
  }

  // Modais e Auxiliares (mantidos como estavam originalmente)
  status: any[] = [];
  // History of maintenance actions
  manutencaoHistory: { status: string; previsao: Date | null; timestamp: Date }[] = [];
  disponibilidades: any[] = [];
  secoes: any[] = [];
  tiposAquisicao: any[] = [];
  tipos: any[] = [];
  marcas: any[] = [];
  exibirModal = false;
  exibirModalTimeline = false;
  exibirModalDetalhes = false;
  equipamentoSelecionado: any = null;
  exibirModalMassa = false;
  formMassa: FormGroup;
  exibirModalTransferenciaMassa = false;
  transferenciaMassaForm: FormGroup;
  exibirModalManutencao = false;
  manutencaoForm: FormGroup;

  estaSelecionado(id: number): boolean { return this.selecionados.some(eq => eq.id === id); }
  limparSelecao() { this.selecionados = []; this.cestaAberta = false; }
  removerDaSelecao(eq: any) { this.selecionados = this.selecionados.filter(item => item.id !== eq.id); if (this.selecionados.length === 0) this.cestaAberta = false; }
  
  obterCorStatus(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'ATIVO' || s === 'DISPONÃVEL') return 'success';
    if (s === 'MANUTENÃ‡ÃƒO' || s === 'PENDENTE_APROVACAO') return 'warning';
    if (s === 'INATIVO' || s === 'EXTRAVIADO' || s === 'DANO') return 'danger';
    return 'neutral';
  }
  obterCorDisponibilidade(disp: string): string {
    const d = disp?.toUpperCase();
    if (d === 'CARGA') return 'success';
    if (d === 'EMPRESTIMO') return 'warning';
    return 'neutral';
  }
  abrirNovo() { this.equipamentoSelecionado = null; this.exibirModal = true; }
  editar(eq: any) { this.equipamentoSelecionado = eq; this.exibirModal = true; }
  onSaved() { this.carregarEquipamentos(1, this.rows, this.filtroGlobal); this.carregarStats(); }
  removerEquipamento(eq: any) {
    if (confirm(`Tem certeza que deseja excluir o equipamento ${eq.patrimonio}?`)) {
      this.equipmentService.remover(eq.id).subscribe({
        next: (res: any) => {
          if (res && res.dadosNovos && res.dadosNovos._acao === 'DELETE') {
            this.messageService.add({ severity: 'info', summary: 'AprovaÃ§Ã£o Solicitada', detail: 'A exclusÃ£o do equipamento foi enviada para o DTEC.', life: 5000 });
          } else {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Equipamento removido do sistema.' });
            this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
            this.carregarStats();
          }
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir equipamento.' })
      });
    }
  }
  verDetalhes(eq: any) { this.equipamentoSelecionado = eq; this.exibirModalDetalhes = true; }
  verTimeline(eq: any) { this.equipamentoSelecionado = eq; this.exibirModalTimeline = true; }

  transferirEquipamento(eq: any) {
    this.selecionados = [eq];
    this.abrirTransferenciaMassa();
  }

  enviarParaManutencao(eq: any) {
    this.selecionados = [eq];
    this.abrirModalManutencao();
  }

  abrirTransferenciaMassa() { if (this.selecionados.length === 0) return; this.transferenciaMassaForm.reset(); this.exibirModalTransferenciaMassa = true; }

// Abre modal de manutenÃ§Ã£o para os equipamentos selecionados
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
            mensagem: 'TransferÃªncia processada diretamente sem aprovaÃ§Ã£o (Admin)'
          }).subscribe({ error: () => {} });
        }
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'TransferÃªncia em massa solicitada.' });
        this.exibirModalTransferenciaMassa = false;
        this.limparSelecao();
        this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao solicitar transferÃªncia.' })
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
    // Confirma criaÃ§Ã£o de ordem de serviÃ§o em massa para os equipamentos selecionados
    confirmarManutencao() {
      if (this.manutencaoForm.invalid) return;
      const ids = this.selecionados.map(i => i.id);
      this.maintenanceService.criarMassa(ids, this.manutencaoForm.value).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ordem de serviÃ§o criada para os equipamentos selecionados.' });
          this.exibirModalManutencao = false;
          this.limparSelecao();
          this.carregarEquipamentos(1, this.rows, this.filtroGlobal);
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao enviar para manutenÃ§Ã£o.' })
      });
    }

  exportarExcelMassa() {
    if (this.selecionados.length === 0) return;
    // ExportaÃ§Ã£o simples em CSV para satisfazer a funÃ§Ã£o de Excel
    const header = 'Patrimonio,Tipo,Marca,Modelo,Serie,Status,Secao\n';
    const rows = this.selecionados.map(e => 
      `${e.patrimonio},${e.tipoEquipamento?.nome},${e.marca?.nome},${e.modelo?.nome || ''},${e.numeroSerie},${e.status?.nome},${e.secao?.sigla}`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `exportacao_sigmat_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Arquivo CSV gerado com sucesso.' });
  }

  imprimirEtiquetasMassa() {
    if (this.selecionados.length === 0) return;
    this.pdfService.gerarEtiquetas(this.selecionados);
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Etiquetas geradas com sucesso.' });
  }

  imprimirEtiquetaUnica(eq: any) {
    this.pdfService.gerarEtiquetas([eq]);
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Etiqueta do patrimÃ´nio ${eq.patrimonio} gerada.` });
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


