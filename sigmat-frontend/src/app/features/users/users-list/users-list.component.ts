import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { SettingsService } from '../../../core/services/settings.service';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

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
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    DialogModule, SelectModule, ButtonModule, InputTextModule, ToastModule, TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private UsersService = inject(UsersService);
  private configService = inject(SettingsService);
  private messageService = inject(MessageService);

  usuarios: any[] = [];
  carregando = true;
  exibirModal = false;
  editando = false;
  filtroNome = '';

  secoes: any[] = [];
  batalhoes: any[] = [];
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
    this.configService.listarSecoes().subscribe((r: any[]) => this.secoes = r);
    this.configService.listarBatalhoes().subscribe((r: any[]) => this.batalhoes = r);
  }

  carregar() {
    this.carregando = true;
    this.UsersService.listarTodos().subscribe({
      next: (res) => { this.usuarios = res; this.carregando = false; },
      error: () => this.carregando = false,
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
    this.form.reset();
    this.exibirModal = true;
  }

  editar(u: any) {
    this.editando = true;
    this.form.patchValue(u);
    this.exibirModal = true;
  }

  salvar() {
    if (this.form.invalid) return;
    const dados = { ...this.form.value };
    if (!this.editando) delete dados.id;

    const acao = this.editando
      ? this.UsersService.atualizar(dados.id, dados)
      : this.UsersService.criar(dados);

    acao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Sucesso',
          detail: `Usuário ${this.editando ? 'atualizado' : 'cadastrado'}!`,
        });
        this.exibirModal = false;
        this.carregar();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Não foi possível salvar o usuário.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
      },
    });
  }

  remover(id: number, nome: string) {
    if (!confirm(`Remover o usuário "${nome}"?`)) return;
    this.UsersService.remover(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Removido', detail: 'Usuário excluído.' });
        this.carregar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover.' }),
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



