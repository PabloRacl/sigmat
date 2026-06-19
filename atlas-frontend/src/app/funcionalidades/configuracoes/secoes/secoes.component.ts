import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings-sections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextarea,
    SelectModule,
    ConfirmDialogModule,
    LayoutPaginaComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './secoes.component.html',
  styleUrls: ['./secoes.component.scss']
})
export class SettingsSectionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private equipmentService = inject(EquipmentService);
  private transfersService = inject(TransfersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // flag to detect if we are on the dedicated "Seções" route
  isSecoesRoute: boolean = false;

  usuario: any = null;
  userPerfil: string | null = null;
  userBatalhaoId: number | null = null;
  userDiretoriaId: number | null = null;

  secoes: any[] = [];
  batalhoes: any[] = [];
  tipos: any[] = [];
  marcas: any[] = [];
  modelos: any[] = [];
  statusList: any[] = [];
  abaAtiva: 'secoes' | 'tipos' | 'marcas' | 'modelos' | 'status' = 'secoes';

  carregando = false;
  statusDialogVisivel = false;
  editandoStatus = false;
  statusForm: FormGroup;
  statusSelecionadoId: number | null = null;
  dialogVisivel = false;
  tipoDialogVisivel = false;
  marcaDialogVisivel = false;
  modeloDialogVisivel = false;

  exibirModalTransferencia = false;
  editando = false;
  totalEquipamentos = 0;
  origemSecaoId: number | null = null;
  destinoSecaoId: number | null = null;
  equipamentosOrigem: any[] = [];
  equipamentoSelecionadoId: number | null = null;
  observacaoTransferencia = '';
  destinosDisponiveis: any[] = [];

  form: FormGroup;
  tipoForm: FormGroup;
  marcaForm: FormGroup;
  modeloForm: FormGroup;

  constructor() {
    this.form = this.fb.group({
      id: [null],
      sigla: ['', Validators.required],
      nome: ['', Validators.required],
      batalhaoId: [null, Validators.required]
    });
    this.tipoForm = this.fb.group({
      nome: ['', Validators.required]
    });
    this.marcaForm = this.fb.group({
      nome: ['', Validators.required]
    });
    this.modeloForm = this.fb.group({
      nome: ['', Validators.required],
      marcaId: [null, Validators.required]
    });
    this.statusForm = this.fb.group({
      nome: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.userPerfil = this.usuario?.perfil;
    this.userBatalhaoId = this.usuario?.batalhaoId ?? null;
    this.userDiretoriaId = this.usuario?.diretoriaId ?? null;
    this.isSecoesRoute = this.router.url.includes('/secoes');
    this.carregarDados();
  }

  // ---------- Data loading ----------
  carregarDados() {
    this.carregando = true;
    this.settingsService.listarSecoes().subscribe({
      next: (res) => {
        this.secoes = res || [];
        this.atualizarTotalEquipamentos();
        this.carregando = false;
      },
      error: () => (this.carregando = false)
    });

    this.settingsService.listarBatalhoes().subscribe({
      next: (res) => {
        const batalhoes = res || [];
        if (this.userPerfil === 'USUARIO_BATALHAO' || this.userPerfil === 'COMANDANTE') {
          this.batalhoes = batalhoes.filter((b: any) => b.id === this.userBatalhaoId);
        } else if (this.userPerfil === 'DIRETORIA') {
          this.batalhoes = batalhoes.filter((b: any) => b.diretoriaId === this.userDiretoriaId);
        } else {
          this.batalhoes = batalhoes;
        }
      }
    });

    this.settingsService.listarTipos().subscribe({ next: (res) => (this.tipos = res || []) });
    this.settingsService.listarMarcas().subscribe({ next: (res) => (this.marcas = res || []) });
    this.settingsService.listarModelos().subscribe({ next: (res) => (this.modelos = res || []) });
    this.settingsService.listarStatus().subscribe({ next: (res) => (this.statusList = res || []) });
  }

  // ---------- Dialog handling ----------
  abrirDialog(secao?: any) {
    this.editando = !!secao;
    this.dialogVisivel = true;
    if (secao) {
      this.form.patchValue({
        id: secao.id,
        sigla: secao.sigla,
        nome: secao.nome,
        batalhaoId: secao.batalhaoId
      });
    } else {
      this.form.reset();
      this.form.patchValue({ id: null });
      if (this.userPerfil === 'USUARIO_BATALHAO' && this.userBatalhaoId) {
        this.form.patchValue({ batalhaoId: this.userBatalhaoId });
      }
    }
    if (this.userPerfil === 'USUARIO_BATALHAO') {
      this.form.get('batalhaoId')?.disable();
    } else {
      this.form.get('batalhaoId')?.enable();
    }
  }

  fecharDialog() {
    this.dialogVisivel = false;
  }

  abrirModalTransferencia(secao?: any) {
    this.origemSecaoId = secao?.id ?? this.usuario?.secaoId ?? null;
    this.destinoSecaoId = null;
    this.equipamentoSelecionadoId = null;
    this.observacaoTransferencia = '';
    this.exibirModalTransferencia = true;
    this.filtrarDestinosPorOrigem();
  }

  filtrarDestinosPorOrigem() {
    const origem = this.secoes.find((s: any) => s.id === this.origemSecaoId);
    const batalhaoId = origem?.batalhaoId ?? this.userBatalhaoId;
    this.destinosDisponiveis = this.secoes.filter((s: any) => s.batalhaoId === batalhaoId && s.id !== this.origemSecaoId);
    if (this.origemSecaoId) {
      this.carregarEquipamentosOrigem(this.origemSecaoId);
    } else {
      this.equipamentosOrigem = [];
    }
  }

  carregarEquipamentosOrigem(secaoId: number) {
    this.equipmentService.listarTodos(1, 1000, '', { secaoId }).subscribe({
      next: (res) => (this.equipamentosOrigem = res.itens || []),
      error: () => (this.equipamentosOrigem = [])
    });
  }

  confirmarTransferenciaInterna() {
    if (!this.equipamentoSelecionadoId || !this.destinoSecaoId) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione equipamento e seção de destino.' });
      return;
    }
    this.transfersService.solicitar({ equipamentoId: this.equipamentoSelecionadoId, destinoId: this.destinoSecaoId, observacao: this.observacaoTransferencia }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Transferência criada', detail: 'Solicitação de transferência interna enviada com sucesso.' });
        this.exibirModalTransferencia = false;
        this.carregarDados();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao criar transferência interna.' });
      }
    });
  }

  atualizarTotalEquipamentos() {
    this.totalEquipamentos = this.secoes.reduce((total, secao) => total + (secao._count?.equipamentos || 0), 0);
  }

  salvar() {
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Validação', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }
    const dados = this.form.getRawValue();
    const action = this.editando ? this.settingsService.atualizarSecao(dados.id, dados) : this.settingsService.criarSecao(dados);
    action.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Seção ${this.editando ? 'atualizada' : 'criada'} com sucesso.` });
        this.fecharDialog();
        this.carregarDados();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao salvar seção.' });
      }
    });
  }

  getBatalhaoNome(id: number) {
    return this.batalhoes.find((b: any) => b.id === id)?.sigla || '—';
  }

  // ---------- Tipo ----------
  abrirDialogTipo() {
    this.tipoForm.reset();
    this.tipoDialogVisivel = true;
  }

  salvarTipo() {
    if (this.tipoForm.invalid) return;
    this.settingsService.criarTipo(this.tipoForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Tipo criado com sucesso.' });
        this.tipoDialogVisivel = false;
        this.carregarDados();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Erro ao criar tipo.' })
    });
  }

  excluirTipo(id: number, nome: string) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o tipo de equipamento "${nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.settingsService.excluirTipo(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Tipo excluído com sucesso.' });
            this.carregarDados();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Erro ao excluir tipo.' })
        });
      }
    });
  }

  // ---------- Marca ----------
  abrirDialogMarca() {
    this.marcaForm.reset();
    this.marcaDialogVisivel = true;
  }

  salvarMarca() {
    if (this.marcaForm.invalid) return;
    this.settingsService.criarMarca(this.marcaForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Marca criada com sucesso.' });
        this.marcaDialogVisivel = false;
        this.carregarDados();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Erro ao criar marca.' })
    });
  }

  excluirMarca(id: number, nome: string) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir a marca "${nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.settingsService.excluirMarca(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Marca excluída com sucesso.' });
            this.carregarDados();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Erro ao excluir marca.' })
        });
      }
    });
  }

  // ---------- Modelo ----------
  abrirDialogModelo() {
    this.modeloForm.reset();
    this.modeloDialogVisivel = true;
  }

  salvarModelo() {
    if (this.modeloForm.invalid) return;
    this.settingsService.criarModelo(this.modeloForm.value).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Modelo criado com sucesso.' });
        this.modeloDialogVisivel = false;
        this.carregarDados();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Erro ao criar modelo.' })
    });
  }

  excluirModelo(id: number, nome: string) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o modelo "${nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.settingsService.excluirModelo(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Modelo excluído com sucesso.' });
            this.carregarDados();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err.error?.message || 'Erro ao excluir modelo.' })
        });
      }
    });
  }

  getMarcaNome(id: number) {
    return this.marcas.find((m: any) => m.id === id)?.nome || '—';
  }

  // ---------- Status ----------
  abrirDialogStatus(status?: any) {
    this.editandoStatus = !!status;
    this.statusSelecionadoId = status?.id ?? null;
    this.statusForm.reset();
    if (status) {
      this.statusForm.patchValue({ nome: status.nome });
    }
    this.statusDialogVisivel = true;
  }

  salvarStatus() {
    if (this.statusForm.invalid) return;
    const dados = this.statusForm.value;
    const acao = this.editandoStatus && this.statusSelecionadoId
      ? this.settingsService.atualizarStatus(this.statusSelecionadoId, dados)
      : this.settingsService.criarStatus(dados);
    acao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Status ${this.editandoStatus ? 'atualizado' : 'criado'} com sucesso.`
        });
        this.statusDialogVisivel = false;
        this.carregarDados();
      },
      error: (err) => this.messageService.add({
        severity: 'error', summary: 'Erro',
        detail: err?.error?.message || 'Erro ao salvar status.'
      })
    });
  }

  excluirStatus(id: number, nome: string) {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o status "${nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.settingsService.excluirStatus(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status excluído com sucesso.' });
            this.carregarDados();
          },
          error: (err) => this.messageService.add({
            severity: 'error', summary: 'Erro',
            detail: err?.error?.message || 'Erro ao excluir status.'
          })
        });
      }
    });
  }
}
