import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../../nucleo/servicos/usuarios.service';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { AccessRequestsFrontendService } from '../../../nucleo/servicos/solicitacoes-acesso.service';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TimelineModule } from 'primeng/timeline';
import { BadgeModule } from 'primeng/badge';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { UsuarioListagem } from '../../../nucleo/interfaces/usuario.interface';

export interface SolicitacaoAcesso {
  id: number;
  nome: string;
  usuario: string;
  matricula: string;
  cpf?: string;
  unidade: string;
  motivo: string;
  status?: string;
  organizacaoDisp?: string;
  secaoSigla?: string;
  createdAt?: Date | string;
  [key: string]: unknown;
}

const PERFIS = [
  { label: 'Administrador DTEC', value: 'ADMIN_DTEC' },
  { label: 'Diretoria', value: 'DIRETORIA' },
  { label: 'Comandante de Batalhão', value: 'COMANDANTE' },
  { label: 'Usuário de Batalhão', value: 'USUARIO_BATALHAO' },
];

const POSTOS = [
  'Soldado', 'Cabo', 'Terceiro-Sargento', 'Segundo-Sargento',
  'Primeiro-Sargento', 'Subtenente', 'Aspirante', 'Segundo-Tenente',
  'Primeiro-Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel',
];

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    DialogModule, SelectModule, ButtonModule, InputTextModule, Textarea, ToastModule, TooltipModule,
    ConfirmDialogModule,
    TimelineModule,
    BadgeModule,
    EstadoVazioComponent,
    LayoutPaginaComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.scss'],
})
export class UsersListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private UsersService = inject(UsersService);
  private configService = inject(SettingsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private accessReqService = inject(AccessRequestsFrontendService);

  usuarios: UsuarioListagem[] = [];
  solicitacoes: SolicitacaoAcesso[] = [];
  exibirDialogoRejeicao = false;
  solicitacaoRejeicao: SolicitacaoAcesso | null = null;
  motivoRejeicao = '';
  carregando = true;
  exibirModal = false;
  editando = false;
  filtroNome = '';
  aprovandoSolicitacaoId: number | null = null;

  // Gestão de Perfil de Usuário
  exibirFicha = false;
  usuarioSelecionado: UsuarioListagem | null = null;
  logsUsuario: any[] = [];
  carregandoLogs = false;

  secoes: Record<string, any>[] = [];
  batalhoes: Record<string, any>[] = [];
  perfis = PERFIS;
  postos = POSTOS.map(p => ({ label: p, value: p }));

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      id: [null],
      login: ['', Validators.required],
      matricula: ['', Validators.required],
      nome: ['', Validators.required],
      email: [''],
      postoGraduacao: [null],
      perfil: [null, Validators.required],
      secaoId: [null],
      batalhaoId: [null],
    });
  }

  ngOnInit(): void {
    this.carregar();
    this.configService.listarSecoes().subscribe((r: Record<string, any>[]) => this.secoes = r);
    this.configService.listarBatalhoes().subscribe((r: Record<string, any>[]) => this.batalhoes = r);
  }

  carregar() {
    this.carregando = true;
    
    // Carregar usuários
    this.UsersService.listarTodos().subscribe({
      next: (res) => { 
        this.usuarios = res; 
        this.carregarSolicitacoes();
      },
      error: () => this.carregando = false,
    });
  }

  carregarSolicitacoes() {
    this.accessReqService.listarPendentes().subscribe({
      next: (res) => {
        this.solicitacoes = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
  }

  aprovarSolicitacao(req: SolicitacaoAcesso) {
    this.editando = false;
    this.aprovandoSolicitacaoId = req.id;
    this.form.reset({
      login: req['login'] || req.usuario,
      matricula: req.matricula,
      nome: req.nome,
      email: req['email'] || '',
      postoGraduacao: req['postoGraduacao'] || null,
      perfil: req['perfil'] || null,
    });
    this.exibirModal = true;
  }

  rejeitarSolicitacao(req: SolicitacaoAcesso) {
    this.solicitacaoRejeicao = req;
    this.motivoRejeicao = '';
    this.exibirDialogoRejeicao = true;
  }

  confirmarRejeicao() {
    if (!this.motivoRejeicao?.trim() || !this.solicitacaoRejeicao) return;
    this.accessReqService.rejeitar(this.solicitacaoRejeicao.id, this.motivoRejeicao.trim()).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Rejeitada', detail: 'Solicitação rejeitada.' });
        this.exibirDialogoRejeicao = false;
        this.solicitacaoRejeicao = null;
        this.motivoRejeicao = '';
        this.carregarSolicitacoes();
      },
      error: (err) => console.error(err)
    });
  }

  get usuariosFiltrados() {
    if (!this.filtroNome.trim()) return this.usuarios;
    const q = this.filtroNome.toLowerCase();
    return this.usuarios.filter(u =>
      u.nome.toLowerCase().includes(q) ||
      u.login.toLowerCase().includes(q) ||
      u.matricula.toLowerCase().includes(q)
    );
  }

  get totalAdmins()     { return this.usuarios.filter(u => u.perfil === 'ADMIN_DTEC').length; }
  get totalDiretoria()  { return this.usuarios.filter(u => u.perfil === 'DIRETORIA').length; }
  get totalComand()     { return this.usuarios.filter(u => u.perfil === 'COMANDANTE').length; }
  get totalBatalh()     { return this.usuarios.filter(u => u.perfil === 'USUARIO_BATALHAO').length; }

  abrirNovo() {
    this.editando = false;
    this.aprovandoSolicitacaoId = null;
    this.form.reset();
    this.exibirModal = true;
  }

  abrirFicha(u: UsuarioListagem) {
    this.usuarioSelecionado = u;
    this.logsUsuario = [];
    this.carregandoLogs = true;
    this.exibirFicha = true;

    this.UsersService.listarLogsAuditoria(u.matricula || u.nome).subscribe({
      next: (logs) => {
        this.logsUsuario = logs;
        this.carregandoLogs = false;
      },
      error: () => this.carregandoLogs = false
    });
  }

  editar(u: UsuarioListagem) {
    this.editando = true;
    this.aprovandoSolicitacaoId = null;
    this.form.patchValue(u);
    this.exibirModal = true;
  }

  salvar() {
    if (this.form.invalid) return;
    const dados = { ...this.form.value };
    if (!this.editando && !this.aprovandoSolicitacaoId) delete dados.id;

    let acao;
    if (this.aprovandoSolicitacaoId) {
      acao = this.accessReqService.aprovar(this.aprovandoSolicitacaoId, {
        perfil: dados.perfil,
        secaoId: dados.secaoId,
        batalhaoId: dados.batalhaoId,
      });
    } else if (this.editando) {
      acao = this.UsersService.atualizar(dados.id, dados);
    } else {
      acao = this.UsersService.criar(dados);
    }

    acao.subscribe({
      next: () => {
        const msgSucesso = this.aprovandoSolicitacaoId 
          ? 'Solicitação aprovada e perfil provisionado!'
          : `Usuário ${this.editando ? 'atualizado' : 'cadastrado'}!`;
        
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: msgSucesso });
        
        this.exibirModal = false;
        this.aprovandoSolicitacaoId = null;
        this.carregar();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Não foi possível salvar.';
        // toast removido pois o interceptor global já exibe a mensagem de erro
      },
    });
  }

  remover(id: number, nome: string) {
    this.confirmationService.confirm({
      message: `Remover o usuário "${nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.UsersService.remover(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Removido', detail: 'Usuário excluído.' });
            this.carregar();
          },
          error: (err) => console.error(err),
        });
      }
    });
  }

  labelPerfil(perfil: string): string {
    return PERFIS.find(p => p.value === perfil)?.label ?? perfil;
  }

  classePerfil(perfil: string): string {
    return { 
      ADMIN_DTEC: 'admin', 
      DIRETORIA: 'diretoria', 
      COMANDANTE: 'comandante', 
      USUARIO_BATALHAO: 'usuario' 
    }[perfil] ?? 'usuario';
  }

  iniciais(nome: string): string {
    return nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';
  }
}



