import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { NotificationsService, NotificacaoDetalhes } from '../../../nucleo/servicos/notificacoes.service';
import { Observable, Subject } from 'rxjs';
import { ROTAS, ROTAS_RELATIVAS } from '../../../nucleo/utilitarios/rotas.constantes';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { environment } from '../../../environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, InputTextModule, ButtonModule, BadgeModule, TooltipModule, RippleModule],
  templateUrl: './painel.component.html',
  styleUrls: ['./painel.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  readonly ROTAS_RELATIVAS = ROTAS_RELATIVAS;

  usuario$!: Observable<any>;
  notificacoes: NotificacaoDetalhes = { total: 0, aprovacoes: 0, transferencias: 0, manutencao: 0, acesso: 0 };
  isSidebarCollapsed = false;
  menuExpandido: string | null = null;
  termoBusca: string = '';
  showProfileMenu = false;
  showNotifMenu = false;
  avatarError = false;

  saudacao = 'Bem-vindo';
  tempoSessao = 3600; // 60 minutos
  private intervalId: any;

  ngOnInit(): void {
    this.usuario$ = this.authService.usuario$;
    this.definirSaudacao();
    this.iniciarTimer();

    this.notificationsService.pendentes$.subscribe(detalhes => {
      this.notificacoes = detalhes;
    });

    this.notificationsService.atualizarContagem();
  }

  get isUsuarioBatalhao(): boolean {
    return this.authService.getUsuario()?.perfil === 'USUARIO_BATALHAO';
  }

  get isAdmin(): boolean {
    return this.authService.getUsuario()?.perfil === 'ADMIN_DTEC';
  }

  get usuarioAfiliacao(): string {
    const user = this.authService.getUsuario();
    if (!user) return '';

    const parts: string[] = [];
    if (user.batalhaoSigla) {
      parts.push(`Batalhão: ${user.batalhaoSigla}`);
    }
    if (user.secaoSigla && user.secaoSigla !== user.batalhaoSigla) {
      parts.push(`Seção: ${user.secaoSigla}`);
    }
    if (parts.length > 0) {
      return parts.join(' • ');
    }

    if (user.perfil === 'DIRETORIA' && user.diretoriaSigla) {
      return `Diretoria: ${user.diretoriaSigla}`;
    }
    if (user.diretoriaSigla) {
      return `Diretoria: ${user.diretoriaSigla}`;
    }

    return '';
  }

  obterUrlAvatar(matricula: string | undefined): string {
    if (!matricula) return '';
    return `${environment.apiAvatarUrl}${matricula}.jpg`;
  }

  get podeVerUsuarios(): boolean {
    return this.isAdmin;
  }

  get podeVerSecoes(): boolean {
    const perfil = this.authService.getUsuario()?.perfil;
    return ['ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE', 'USUARIO_BATALHAO'].includes(perfil);
  }

  get podeVerAuditoria(): boolean {
    return !this.isUsuarioBatalhao;
  }

  labelPerfil(perfil: string): string {
    const labels: Record<string, string> = {
      ADMIN_DTEC: 'Administrador',
      DIRETORIA: 'Diretoria',
      COMANDANTE: 'Comandante',
      USUARIO_BATALHAO: 'Policial Militar',
    };
    return labels[perfil] || perfil;
  }

  toggleProfileMenu(event?: Event) {
    event?.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) this.showNotifMenu = false;
  }

  toggleNotifMenu(event: Event) {
    event.stopPropagation();
    this.showNotifMenu = !this.showNotifMenu;
    this.showProfileMenu = false;
  }

  getTimerClass(): string {
    if (this.tempoSessao > 1800) {
      return 'safe'; // > 30 min
    } else if (this.tempoSessao > 600) {
      return 'warning'; // entre 10 e 30 min
    } else {
      return 'danger'; // < 10 min
    }
  }

  @HostListener('document:click')
  closeMenus() {
    this.showProfileMenu = false;
    this.showNotifMenu = false;
  }

  navegarPara(rota: string) {
    this.showNotifMenu = false;
    const rotasAbsolutas: Record<string, string> = {
      aprovacoes: ROTAS.APROVACOES,
      manutencao: ROTAS.MANUTENCAO,
      usuarios: ROTAS.USUARIOS,
    };
    this.router.navigate([rotasAbsolutas[rota] || rota]);
  }

  sair() {
    this.authService.logout();
    this.router.navigate([ROTAS.LOGIN]);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      this.menuExpandido = null;
    }
  }

  toggleMenu(menu: string) {
    if (this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
    this.menuExpandido = this.menuExpandido === menu ? null : menu;
  }

  definirSaudacao() {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      this.saudacao = 'Bom dia';
    } else if (hora >= 12 && hora < 18) {
      this.saudacao = 'Boa tarde';
    } else {
      this.saudacao = 'Boa noite';
    }
  }

  iniciarTimer() {
    this.intervalId = setInterval(() => {
      this.tempoSessao--;
      if (this.tempoSessao <= 0) {
        clearInterval(this.intervalId);
        this.sair();
      }
    }, 1000);
  }

  formatarTempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}


