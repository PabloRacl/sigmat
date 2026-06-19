/**
 * [Estado Atual]: Componente de apresenta��o/formul�rio (Dumb Component) para cria��o/edi��o de Equipamentos.
 * [Depend�ncias T�cnicas]:
 *   - Services: EquipmentService, SettingsService, UploadService, MessageService
 * [Hist�rico de Modifica��es]:
 *   - Movido para /feature./equipamentos/formulario-equipamento.
 *   - Adicionado cabe�alho de contexto arquitetural de alta efici�ncia de tokens.
 * [Regras de Neg�cio Imut�veis]:
 *   - Submiss�o e valida��o estritas de dados do formul�rio de Equipamento.
 *   - Campos din�micos baseados no Tipo de Equipamento selecionado.
 */

import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { UploadService } from '../../../nucleo/servicos/carregamento.service';
import { MessageService } from 'primeng/api';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-formulario-equipamento',
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
    DatePickerModule
  ],
  templateUrl: './formulario-equipamento.component.html',
  styleUrls: ['./formulario-equipamento.component.scss']
})
export class EquipmentFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private equipmentService = inject(EquipmentService);
  private configService = inject(SettingsService);
  private messageService = inject(MessageService);
  public uploadService = inject(UploadService);

  @Input() visible = false;
  @Input() equipment: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  editando = false;
  
  // Auxiliares
  tipos: any[] = [];
  marcas: any[] = [];
  modelos: any[] = [];
  modelosFiltrados: any[] = [];
  status: any[] = [];
  disponibilidades: any[] = [];
  batalhoes: any[] = [];
  secoes: any[] = [];
  secoesFiltradas: any[] = [];
  chipsDisponiveis: any[] = [];
  
  // Vínculo Celular/Chip
  chipSelecionado: any = null;
  campoIMEI: string = '';
  campoTelefone: string = '';
  
  // Dialogo para criar registros inline (status, tipo, marca, modelo)
  exibirDialogoPrompt = false;
  rotuloPrompt = '';
  valorPrompt = '';
  callbackPrompt: ((valor: string) => void) | null = null;

  abrirPrompt(rotulo: string, callback: (valor: string) => void) {
    this.rotuloPrompt = rotulo;
    this.valorPrompt = '';
    this.callbackPrompt = callback;
    this.exibirDialogoPrompt = true;
  }

  confirmarPrompt() {
    if (this.valorPrompt?.trim() && this.callbackPrompt) {
      this.callbackPrompt(this.valorPrompt.trim());
    }
    this.exibirDialogoPrompt = false;
    this.callbackPrompt = null;
    this.valorPrompt = '';
  }

  // Campos Dinâmicos
  mapaCampos: any = {
    'CPU': [
      { label: 'Processador', key: 'processador', placeholder: 'Ex: Intel i7 12ª Gen' },
      { label: 'Memória RAM', key: 'memoria_ram', placeholder: 'Ex: 16GB DDR4' },
      { label: 'Armazenamento', key: 'armazenamento', placeholder: 'Ex: SSD 512GB' },
      { label: 'SO', key: 'sistema_operacional', placeholder: 'Ex: Windows 11 Pro' }
    ],
    'MONITOR': [
      { label: 'Tamanho (Pol)', key: 'tamanho_tela', placeholder: 'Ex: 24"' },
      { label: 'Resolução', key: 'resolucao', placeholder: 'Ex: 1920x1080' }
    ],
    'RADIO': [
      { label: 'Frequência', key: 'frequencia', placeholder: 'Ex: UHF / VHF' },
      { label: 'Modelo Bateria', key: 'modelo_bateria', placeholder: 'Ex: NNTN4497' },
      { label: 'Antena', key: 'antena', placeholder: 'Ex: Stubby' }
    ],
    'NOTEBOOK': [
      { label: 'Processador', key: 'processador', placeholder: 'Ex: Ryzen 5' },
      { label: 'Memória RAM', key: 'memoria_ram', placeholder: 'Ex: 8GB' },
      { label: 'Tamanho Tela', key: 'tamanho_tela', placeholder: 'Ex: 15.6"' }
    ],
    'IMPRESSORA': [
      { label: 'Tipo de Impressão', key: 'tipo_impressao', placeholder: 'Ex: Laser / Térmica' },
      { label: 'Modelo Suprimento', key: 'modelo_suprimento', placeholder: 'Ex: Toner TN-660' }
    ]
  };

  camposDinamicos: any[] = [];
  valoresDinamicos: any = {};

  constructor() {
    this.form = this.fb.group({
      id: [null],
      patrimonio: ['', Validators.required],
      numeroSerie: [''],
      sei: [''],
      batalhaoId: [null],
      tipoEquipamentoId: [null, Validators.required],
      marcaId: [null],
      modeloId: [null],
      statusId: [null, Validators.required],
      disponibilidadeId: [null, Validators.required],
      secaoId: [null, Validators.required],
      dataAquisicao: [null],
      observacao: [''],
      especificacoes: this.fb.group({})
    });

    this.form.get('tipoEquipamentoId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.atualizarCamposDinamicos(id);
    });

    this.form.get('marcaId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.atualizarModelosPorMarca(id);
    });

    this.form.get('batalhaoId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.filtrarSecoesPorBatalhao(id);
    });
  }

  ngOnInit() {
    this.carregarAuxiliares();
  }

  ngOnChanges() {
    if (this.visible) {
      if (this.equipment) {
        this.preencherForm(this.equipment);
      } else {
        this.resetarForm();
      }
    }
  }

  carregarAuxiliares() {
    this.configService.listarTipos().subscribe(res => this.tipos = res);
    this.configService.listarMarcas().subscribe(res => this.marcas = res);
    this.configService.listarModelos().subscribe(res => {
      this.modelos = res;
      this.modelosFiltrados = [...res];
      this.atualizarModelosPorMarca(this.form.get('marcaId')?.value);
    });
    this.configService.listarStatus().subscribe(res => {
      this.status = res;
    });
    this.configService.listarDisponibilidades().subscribe(res => this.disponibilidades = res);
    this.configService.listarBatalhoes().subscribe(res => {
      this.batalhoes = res;
    });
    this.configService.listarSecoes().subscribe(res => {
      this.secoes = res;
      this.filtrarSecoesPorBatalhao(this.form.get('batalhaoId')?.value);
    });
    this.carregarChips();
  }

  refreshStatus() {
    this.configService.listarStatus().subscribe(res => this.status = res);
  }

  refreshTipos() {
    this.configService.listarTipos().subscribe(res => this.tipos = res);
  }

  refreshMarcas() {
    this.configService.listarMarcas().subscribe(res => this.marcas = res);
  }

  refreshModelos() {
    this.configService.listarModelos().subscribe(res => {
      this.modelos = res;
      this.atualizarModelosPorMarca(this.form.get('marcaId')?.value);
    });
  }

  solicitarNovoStatus() {
    this.abrirPrompt('Informe o nome do novo status:', nome => {
      const payload = { nome };
      this.configService.criarStatus(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Status criado', detail: 'Status cadastrado com sucesso.' });
          this.refreshStatus();
        },
        error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'N�o foi poss�vel criar o status.' })
      });
    });
  }

  excluirStatus(id: number) {
    this.configService.excluirStatus(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Status exclu�do', detail: 'Status removido com sucesso.' });
        this.refreshStatus();
      },
      error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'N�o foi poss�vel excluir o status.' })
    });
  }

  solicitarNovoTipo() {
    this.abrirPrompt('Informe o nome do novo tipo de equipamento:', nome => {
      const payload = { nome };
      this.configService.criarTipo(payload).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Tipo criado', detail: 'Tipo de equipamento cadastrado com sucesso.' });
          this.refreshTipos();
          this.form.patchValue({ tipoEquipamentoId: res.id });
        },
        error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'N�o foi poss�vel criar o tipo.' })
      });
    });
  }

  solicitarNovaMarca() {
    this.abrirPrompt('Informe o nome da nova marca:', nome => {
      const payload = { nome };
      this.configService.criarMarca(payload).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Marca criada', detail: 'Marca cadastrada com sucesso.' });
          this.refreshMarcas();
          this.form.patchValue({ marcaId: res.id });
        },
        error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'N�o foi poss�vel criar a marca.' })
      });
    });
  }

  solicitarNovoModelo() {
    const marcaId = this.form.get('marcaId')?.value;
    if (!marcaId) {
      this.messageService.add({ severity: 'warn', summary: 'Escolha a marca', detail: 'Selecione a marca antes de cadastrar um novo modelo.' });
      return;
    }
    this.abrirPrompt('Informe o nome do novo modelo:', nome => {
      const payload = { nome, marcaId };
      this.configService.criarModelo(payload).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Modelo criado', detail: 'Modelo cadastrado com sucesso.' });
          this.refreshModelos();
          this.form.patchValue({ modeloId: res.id });
        },
        error: (err: any) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'N�o foi poss�vel criar o modelo.' })
      });
    });
  }

  carregarChips() {
    this.equipmentService.listarTodos(1, 100, 'CHIP').subscribe(res => {
      this.chipsDisponiveis = res.itens || [];
    });
  }

  private extrairBatalhaoId(secao: any): number | null {
    if (!secao) return null;
    if (secao.batalhaoId) return secao.batalhaoId;
    if (secao.batalhao?.id) return secao.batalhao.id;
    return null;
  }

  filtrarSecoesPorBatalhao(batalhaoId: number | null) {
    if (!batalhaoId) {
      this.secoesFiltradas = [...this.secoes];
      return;
    }
    this.secoesFiltradas = this.secoes.filter(s => this.extrairBatalhaoId(s) === batalhaoId);
    const secaoAtual = this.form.get('secaoId')?.value;
    if (secaoAtual && !this.secoesFiltradas.some(s => s.id === secaoAtual)) {
      this.form.patchValue({ secaoId: null });
    }
  }

  resetarForm() {
    this.editando = false;
    this.campoIMEI = '';
    this.campoTelefone = '';
    this.chipSelecionado = null;
    this.valoresDinamicos = {};
    this.camposDinamicos = [];
    this.form.reset();
    this.secoesFiltradas = [...this.secoes];
  }

  preencherForm(eq: any) {
    this.editando = true;
    const specs = eq.especificacoes || {};
    this.campoIMEI = specs.imei || '';
    this.campoTelefone = specs.telefone || '';
    this.chipSelecionado = specs.chip_vinculado_pat ? { patrimonio: specs.chip_vinculado_pat } : null;
    this.valoresDinamicos = { ...specs };
    this.atualizarCamposDinamicos(eq.tipoEquipamentoId);
    this.atualizarModelosPorMarca(eq.marcaId);

    const batalhaoId = this.extrairBatalhaoId(eq.secao);
    this.form.patchValue({
      ...eq,
      batalhaoId,
      dataAquisicao: eq.dataAquisicao ? new Date(eq.dataAquisicao) : null
    });
    if (batalhaoId) this.filtrarSecoesPorBatalhao(batalhaoId);
  }

  atualizarCamposDinamicos(tipoId: number) {
    const tipo = this.tipos.find(t => t.id === tipoId);
    if (!tipo) {
      this.camposDinamicos = [];
      return;
    }
    const nome = tipo.nome.toUpperCase();
    const chaveEncontrada = Object.keys(this.mapaCampos).find(k => nome.includes(k));
    this.camposDinamicos = chaveEncontrada ? this.mapaCampos[chaveEncontrada] : [];
  }

  atualizarModelosPorMarca(marcaId: number | null) {
    if (!marcaId) {
      this.modelosFiltrados = [...this.modelos];
      return;
    }

    this.modelosFiltrados = this.modelos.filter(modelo => modelo.marcaId === marcaId);

    const modeloAtual = this.form.get('modeloId')?.value;
    if (modeloAtual && !this.modelosFiltrados.some(modelo => modelo.id === modeloAtual)) {
      this.form.patchValue({ modeloId: null });
    }
  }

  get exibirCamposCelular(): boolean {
    const tipoId = this.form.get('tipoEquipamentoId')?.value;
    const tipo = this.tipos.find(t => t.id === tipoId);
    if (!tipo) return false;
    const nome = tipo.nome.toUpperCase();
    return nome.includes('CELULAR') || nome.includes('SMARTPHONE') || nome.includes('MOVEL');
  }

  fechar() {
    this.visibleChange.emit(false);
  }

  salvar() {
    if (this.form.invalid) return;
    const dados = { ...this.form.value };
    
    const especificacoesFinais: any = { 
      ...(dados.especificacoes || {}),
      ...this.valoresDinamicos 
    };

    if (this.exibirCamposCelular) {
      especificacoesFinais.imei = this.campoIMEI;
      especificacoesFinais.telefone = this.campoTelefone;
      especificacoesFinais.chip_vinculado_pat = this.chipSelecionado?.patrimonio || null;
    }

    dados.especificacoes = especificacoesFinais;
    const id = dados.id;
    delete dados.id;

    if (dados.dataAquisicao) dados.dataAquisicao = new Date(dados.dataAquisicao).toISOString();

    const acao = this.editando 
      ? this.equipmentService.atualizar(id, dados)
      : this.equipmentService.criar(dados);

    acao.subscribe({
      next: (res: any) => {
        if (res && res.dadosNovos) {
          this.messageService.add({ severity: 'info', summary: 'Aprovação Solicitada', detail: 'Sua alteração foi enviada para o DTEC. Você pode acompanhá-la na tela de Aprovações.', life: 5000 });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Registro salvo!' });
        }
        this.saved.emit();
        this.fechar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar.' })
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


