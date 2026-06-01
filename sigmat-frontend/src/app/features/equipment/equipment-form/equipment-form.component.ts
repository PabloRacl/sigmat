/**
 * [Estado Atual]: Componente de apresentação/formulário (Dumb Component) para criação/edição de Equipamentos.
 * [Dependências Técnicas]:
 *   - Services: EquipmentService, SettingsService, UploadService, MessageService
 * [Histórico de Modificações]:
 *   - Movido para /features/equipment/equipment-form.
 *   - Adicionado cabeçalho de contexto arquitetural de alta eficiência de tokens.
 * [Regras de Negócio Imutáveis]:
 *   - Submissão e validação estritas de dados do formulário de Equipamento.
 *   - Campos dinâmicos baseados no Tipo de Equipamento selecionado.
 */

import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EquipmentService } from '../../../core/services/equipment.service';
import { SettingsService } from '../../../core/services/settings.service';
import { UploadService } from '../../../core/services/upload.service';
import { MessageService } from 'primeng/api';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-equipment-form',
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
  templateUrl: './equipment-form.component.html',
  styleUrls: ['./equipment-form.component.scss']
})
export class EquipmentFormComponent implements OnInit {
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
  secoes: any[] = [];
  chipsDisponiveis: any[] = [];
  
  // VÃ­nculo Celular/Chip
  chipSelecionado: any = null;
  campoIMEI: string = '';
  campoTelefone: string = '';
  
  // Campos DinÃ¢micos
  mapaCampos: any = {
    'CPU': [
      { label: 'Processador', key: 'processador', placeholder: 'Ex: Intel i7 12Âª Gen' },
      { label: 'MemÃ³ria RAM', key: 'memoria_ram', placeholder: 'Ex: 16GB DDR4' },
      { label: 'Armazenamento', key: 'armazenamento', placeholder: 'Ex: SSD 512GB' },
      { label: 'SO', key: 'sistema_operacional', placeholder: 'Ex: Windows 11 Pro' }
    ],
    'MONITOR': [
      { label: 'Tamanho (Pol)', key: 'tamanho_tela', placeholder: 'Ex: 24"' },
      { label: 'ResoluÃ§Ã£o', key: 'resolucao', placeholder: 'Ex: 1920x1080' }
    ],
    'RADIO': [
      { label: 'FrequÃªncia', key: 'frequencia', placeholder: 'Ex: UHF / VHF' },
      { label: 'Modelo Bateria', key: 'modelo_bateria', placeholder: 'Ex: NNTN4497' },
      { label: 'Antena', key: 'antena', placeholder: 'Ex: Stubby' }
    ],
    'NOTEBOOK': [
      { label: 'Processador', key: 'processador', placeholder: 'Ex: Ryzen 5' },
      { label: 'MemÃ³ria RAM', key: 'memoria_ram', placeholder: 'Ex: 8GB' },
      { label: 'Tamanho Tela', key: 'tamanho_tela', placeholder: 'Ex: 15.6"' }
    ],
    'IMPRESSORA': [
      { label: 'Tipo de ImpressÃ£o', key: 'tipo_impressao', placeholder: 'Ex: Laser / TÃ©rmica' },
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

    this.form.get('tipoEquipamentoId')?.valueChanges.subscribe(id => {
      this.atualizarCamposDinamicos(id);
    });

    this.form.get('marcaId')?.valueChanges.subscribe(id => {
      this.atualizarModelosPorMarca(id);
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
    this.configService.listarSecoes().subscribe(res => this.secoes = res);
    this.carregarChips();
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

  solicitarNovoTipo() {
    const nome = prompt('Informe o nome do novo tipo de equipamento:');
    if (!nome?.trim()) return;
    const payload = { nome: nome.trim() };
    this.configService.criarTipo(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Tipo criado', detail: 'Tipo de equipamento cadastrado com sucesso.' });
        this.refreshTipos();
        this.form.patchValue({ tipoEquipamentoId: res.id });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'NÃ£o foi possÃ­vel criar o tipo.' })
    });
  }

  solicitarNovaMarca() {
    const nome = prompt('Informe o nome da nova marca:');
    if (!nome?.trim()) return;
    const payload = { nome: nome.trim() };
    this.configService.criarMarca(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Marca criada', detail: 'Marca cadastrada com sucesso.' });
        this.refreshMarcas();
        this.form.patchValue({ marcaId: res.id });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'NÃ£o foi possÃ­vel criar a marca.' })
    });
  }

  solicitarNovoModelo() {
    const marcaId = this.form.get('marcaId')?.value;
    if (!marcaId) {
      this.messageService.add({ severity: 'warn', summary: 'Escolha a marca', detail: 'Selecione a marca antes de cadastrar um novo modelo.' });
      return;
    }
    const nome = prompt('Informe o nome do novo modelo:');
    if (!nome?.trim()) return;
    const payload = { nome: nome.trim(), marcaId };
    this.configService.criarModelo(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Modelo criado', detail: 'Modelo cadastrado com sucesso.' });
        this.refreshModelos();
        this.form.patchValue({ modeloId: res.id });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'NÃ£o foi possÃ­vel criar o modelo.' })
    });
  }

  carregarChips() {
    this.equipmentService.listarTodos(1, 100, 'CHIP').subscribe(res => {
      this.chipsDisponiveis = res.itens || [];
    });
  }

  resetarForm() {
    this.editando = false;
    this.campoIMEI = '';
    this.campoTelefone = '';
    this.chipSelecionado = null;
    this.valoresDinamicos = {};
    this.camposDinamicos = [];
    this.form.reset();
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

    this.form.patchValue({
      ...eq,
      dataAquisicao: eq.dataAquisicao ? new Date(eq.dataAquisicao) : null
    });
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
          this.messageService.add({ severity: 'info', summary: 'AprovaÃ§Ã£o Solicitada', detail: 'Sua alteraÃ§Ã£o foi enviada para o DTEC. VocÃª pode acompanhÃ¡-la na tela de AprovaÃ§Ãµes.', life: 5000 });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Registro salvo!' });
        }
        this.saved.emit();
        this.fechar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar.' })
    });
  }
}


