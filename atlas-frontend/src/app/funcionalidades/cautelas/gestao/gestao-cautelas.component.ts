import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoansService } from '../../../nucleo/servicos/cautelas.service';
import { UsersService } from '../../../nucleo/servicos/usuarios.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { UsuarioListagem } from '../../../nucleo/interfaces/usuario.interface';
import { PdfService } from '../../../nucleo/servicos/pdf.service';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { IndicadorStatusComponent } from '../../../componentes/indicador-status/indicador-status.component';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';
import { FiltroLateralComponent, FiltroConfig } from '../../../componentes/filtro-lateral/filtro-lateral.component';
import { SeveridadeStatus } from '../../../nucleo/utilitarios/status-utilitarios';

@Component({
  selector: 'app-gestao-cautelas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    DialogModule, SelectModule, ButtonModule, InputTextModule,
    DatePickerModule, ToastModule, TabsModule, TooltipModule, TableModule,
    ConfirmDialogModule,
    LayoutPaginaComponent,
    IndicadorStatusComponent,
    EstadoVazioComponent,
    FiltroLateralComponent
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './gestao-cautelas.component.html',
  styleUrls: ['./gestao-cautelas.component.scss'],
})
export class LoansManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private LoansService = inject(LoansService);
  private pdfService = inject(PdfService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);

  emprestados: Record<string, any>[]    = [];
  historico: Record<string, any>[]      = [];
  vencidos: Record<string, any>[]       = [];
  equipamentos: Record<string, any>[]   = [];
  
  emprestadosFiltrados: Record<string, any>[] = [];
  vencidosFiltrados: Record<string, any>[]    = [];
  historicoFiltrado: Record<string, any>[]    = [];

  selecionados: Record<string, any>[]   = []; // Itens marcados na tabela
  carregando            = true;
  abaAtiva              = '0';
  dataHoje              = new Date();
  isPolicial            = false;
  usuarios: UsuarioListagem[]       = [];

  // Filtros Premium
  buscaTexto = '';
  exibirFiltrosAvancados = false;
  filtroAtivo = false;
  modeloFiltros: Record<string, any> = {};

  configFiltros: FiltroConfig[] = [
    { key: 'patrimonio', label: 'Patrimônio', tipo: 'text', placeholder: 'Ex: 123456' },
    { key: 'tipoEquipamento', label: 'Tipo de Equipamento', tipo: 'text', placeholder: 'Ex: Rádio' },
    { key: 'solicitante', label: 'Solicitante', tipo: 'text', placeholder: 'Ex: SD Silva' },
    { key: 'dataSaidaInicio', label: 'Saída a partir de', tipo: 'date' },
    { key: 'dataSaidaFim', label: 'Saída até', tipo: 'date' },
    { key: 'dataRetornoInicio', label: 'Retorno a partir de', tipo: 'date' },
    { key: 'dataRetornoFim', label: 'Retorno até', tipo: 'date' },
    { key: 'status', label: 'Status (Para Histórico)', tipo: 'select', opcoes: [
      { label: 'Todos os Status', value: null },
      { label: 'Disponível', value: 'DISPONÍVEL' },
      { label: 'Emprestado', value: 'EMPRESTADO' },
      { label: 'Manutenção', value: 'MANUTENÇÃO' }
    ]}
  ];

  // Modal SEI
  exibirModalSEI = false;

  // Modal saída
  exibirModalSaida = false;
  equipamentoSelecionado: Record<string, any> | null = null;
  formSaida: FormGroup;

  // Modal retorno
  exibirModalRetorno = false;
  itemRetorno: Record<string, any> | null = null;

  constructor() {
    this.formSaida = this.fb.group({
      equipamentoId: [null, Validators.required],
      usuarioResponsavelId: [null, Validators.required],
      dataSolicitacao:      [new Date(), Validators.required],
      dataRetornoEmprestimo: [null],
    });
  }

  pesquisarAvancado() {
    this.aplicarFiltros();
    this.exibirFiltrosAvancados = false;
  }

  aplicarFiltros() {
    const texto = this.buscaTexto.trim().toLowerCase();
    this.filtroAtivo = Object.values(this.modeloFiltros).some(val => val !== null && val !== '');

    const filtrarArray = (lista: Record<string, any>[]) => {
      return lista.filter(item => {
        const matchTexto = !texto || [
          item['patrimonio'],
          item['tipoEquipamento']?.['nome'],
          item['solicitante'],
          item['disponibilidade']?.['nome'],
          this.formatDate(item['dataSolicitacao']),
          this.formatDate(item['dataRetornoEmprestimo'])
        ].some(v => v?.toString().toLowerCase().includes(texto));

        let matchAvancado = true;
        if (this.filtroAtivo) {
          if (this.modeloFiltros['patrimonio'] && !item['patrimonio']?.toString().toLowerCase().includes(this.modeloFiltros['patrimonio'].toLowerCase())) matchAvancado = false;
          if (this.modeloFiltros['tipoEquipamento'] && !item['tipoEquipamento']?.['nome']?.toString().toLowerCase().includes(this.modeloFiltros['tipoEquipamento'].toLowerCase())) matchAvancado = false;
          if (this.modeloFiltros['solicitante'] && !item['solicitante']?.toString().toLowerCase().includes(this.modeloFiltros['solicitante'].toLowerCase())) matchAvancado = false;
          
          if (this.modeloFiltros['dataSaidaInicio'] && item['dataSolicitacao']) {
            const dataSaida = new Date(item['dataSolicitacao'] as string);
            const inicio = new Date(this.modeloFiltros['dataSaidaInicio']);
            inicio.setHours(0, 0, 0, 0);
            if (dataSaida < inicio) matchAvancado = false;
          }
          if (this.modeloFiltros['dataSaidaFim'] && item['dataSolicitacao']) {
            const dataSaida = new Date(item['dataSolicitacao'] as string);
            const fim = new Date(this.modeloFiltros['dataSaidaFim']);
            fim.setHours(23, 59, 59, 999);
            if (dataSaida > fim) matchAvancado = false;
          }
          if (this.modeloFiltros['dataRetornoInicio'] && item['dataRetornoEmprestimo']) {
            const dataRetorno = new Date(item['dataRetornoEmprestimo'] as string);
            const inicio = new Date(this.modeloFiltros['dataRetornoInicio']);
            inicio.setHours(0, 0, 0, 0);
            if (dataRetorno < inicio) matchAvancado = false;
          } else if (this.modeloFiltros['dataRetornoInicio'] && !item['dataRetornoEmprestimo']) {
            matchAvancado = false;
          }
          if (this.modeloFiltros['dataRetornoFim'] && item['dataRetornoEmprestimo']) {
            const dataRetorno = new Date(item['dataRetornoEmprestimo'] as string);
            const fim = new Date(this.modeloFiltros['dataRetornoFim']);
            fim.setHours(23, 59, 59, 999);
            if (dataRetorno > fim) matchAvancado = false;
          } else if (this.modeloFiltros['dataRetornoFim'] && !item['dataRetornoEmprestimo']) {
            matchAvancado = false;
          }
          if (this.modeloFiltros['status']) {
            const statusReal = item['disponibilidade']?.['nome']?.toString().toUpperCase() || 'EMPRESTADO';
            if (statusReal !== this.modeloFiltros['status']) {
              matchAvancado = false;
            }
          }
        }
        return matchTexto && matchAvancado;
      });
    };

    this.emprestadosFiltrados = filtrarArray(this.emprestados);
    this.vencidosFiltrados = filtrarArray(this.vencidos);
    this.historicoFiltrado = filtrarArray(this.historico);
  }

  ngOnInit() { 
    this.isPolicial = (this.authService.getUsuario()?.perfil as string) === 'POLICIAL';
    this.carregarTudo(); 
  }

  carregarTudo() {
    this.carregando = true;
    this.LoansService.listarEmprestados().subscribe({
      next: r => { this.emprestados = r; this.aplicarFiltros(); this.carregando = false; },
      error: () => this.carregando = false
    });
    this.LoansService.historico().subscribe(r => { this.historico = r; this.aplicarFiltros(); });
    this.LoansService.vencidos().subscribe(r => { this.vencidos = r; this.aplicarFiltros(); });
    this.pesquisarEquipamentosDisponiveis('');
    if (!this.isPolicial) {
      this.usersService.listarTodos().subscribe(u => this.usuarios = u);
    }
  }

  pesquisarEquipamentosDisponiveis(termo: string) {
    this.LoansService.listarEquipamentosDisponiveis(termo).subscribe(r => {
      const itens = r.itens || [];
      // Filtra apenas os que estão como DISPONÍVEL no sistema
      this.equipamentos = itens.filter((e: Record<string, any>) => (e['disponibilidade'] as Record<string, any>)?.['nome']?.toString().toUpperCase() === 'DISPONÍVEL');
    });
  }

  onFiltrarEquipamento(event: Record<string, any>) {
    this.pesquisarEquipamentosDisponiveis((event['filter'] as string) || '');
  }

  abrirSaida() {
    this.formSaida.reset({ dataSolicitacao: new Date() });
    this.pesquisarEquipamentosDisponiveis('');
    this.exibirModalSaida = true;
  }

  confirmarSaida() {
    if (this.formSaida.invalid) return;
    const v = this.formSaida.value;
    const usu = this.usuarios.find(u => u.id === v.usuarioResponsavelId);
    const dados = {
      solicitante: usu ? usu.nome : 'Desconhecido',
      usuarioResponsavelId: v.usuarioResponsavelId,
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
      error: (err) => console.error(err),
    });
  }

  abrirRetorno(item: Record<string, any>) {
    this.itemRetorno = item;
    this.exibirModalRetorno = true;
  }

  confirmarRetorno() {
    if (!this.itemRetorno) return;
    this.LoansService.registrarRetorno(this.itemRetorno['id'] as number).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Retorno confirmado!', detail: 'Equipamento marcado como Disponível.' });
        this.exibirModalRetorno = false;
        this.itemRetorno = null;
        this.carregarTudo();
      },
      error: (err) => console.error(err),
    });
  }

  imprimirCautela(item: Record<string, any>) {
    this.pdfService.gerarCautela(item);
  }

  gerarCautelaColetiva(isCelular: boolean = false) {
    if (this.selecionados.length === 0) return;
    if (isCelular) {
      this.pdfService.gerarCautelaCelulares(this.selecionados);
    } else {
      this.pdfService.gerarCautelaColetiva(this.selecionados);
    }
  }

  confirmarRetornoMassa() {
    if (this.selecionados.length === 0) return;
    this.confirmationService.confirm({
      message: `Deseja baixar o retorno de ${this.selecionados.length} equipamentos em lote?`,
      header: 'Confirmar Retorno',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.carregando = true;
        const requests = this.selecionados.map(item => this.LoansService.registrarRetorno(item['id'] as number));
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
              // toast removido pois o interceptor global já exibe a mensagem de erro
              this.carregando = false;
            }
          });
        });
      }
    });
  }

  isCelularSEI = false;
  abrirModalSEI(isCelular: boolean = false) {
    if (this.selecionados.length === 0) return;
    this.isCelularSEI = isCelular;
    this.exibirModalSEI = true;
  }

  getImei(item: any): string {
    const spec = item?.especificacoes;
    if (!spec) return 'N/A';
    if (typeof spec === 'string') {
      try { return JSON.parse(spec).imei || 'N/A'; } catch (e) { return 'N/A'; }
    }
    return spec.imei || 'N/A';
  }

  getTelefone(item: any): string {
    const spec = item?.especificacoes;
    if (!spec) return 'N/A';
    if (typeof spec === 'string') {
      try { return JSON.parse(spec).telefone || 'N/A'; } catch (e) { return 'N/A'; }
    }
    return spec.telefone || 'N/A';
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

  isVencido(item: Record<string, any>): boolean {
    if (!item['dataRetornoEmprestimo']) return false;
    return new Date(item['dataRetornoEmprestimo'] as string) < new Date();
  }

  severidadeVencimento(item: Record<string, any>): SeveridadeStatus {
    return this.isVencido(item) ? 'perigo' : 'sucesso';
  }

  diasAtraso(item: Record<string, any>): number {
    if (!item['dataRetornoEmprestimo']) return 0;
    const diff = new Date().getTime() - new Date(item['dataRetornoEmprestimo'] as string).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  formatDate(dateString: any): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}



