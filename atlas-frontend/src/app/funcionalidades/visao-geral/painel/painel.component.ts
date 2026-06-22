import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { NotificationsService, NotificacaoDetalhes } from '../../../nucleo/servicos/notificacoes.service';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ROTAS, ROTAS_RELATIVAS } from '../../../nucleo/utilitarios/rotas.constantes';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { environment } from '../../../environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, InputTextModule, ButtonModule, BadgeModule, TooltipModule, RippleModule, DialogModule],
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
  isMobileMenuOpen = false;
  menuExpandido: string | null = null;
  termoBusca: string = '';
  showProfileMenu = false;
  showNotifMenu = false;
  avatarError = false;
  showModalExpiracao = false;
  renovandoSessao = false;

  saudacao = 'Bem-vindo';
  tempoSessao = 0;
  private intervalId: any;

  ngOnInit(): void {
    this.usuario$ = this.authService.usuario$;
    this.definirSaudacao();
    this.atualizarTempoSessao();
    this.iniciarTimer();

    this.notificationsService.pendentes$.subscribe(detalhes => {
      this.notificacoes = detalhes;
    });

    this.notificationsService.atualizarContagem();

    // Fecha o menu mobile ao navegar para qualquer rota
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isMobileMenuOpen = false;
    });
  }

  // ... (keeping other methods intact up to iniciarTimer)

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

  get isPolicial(): boolean {
    return (this.authService.getUsuario()?.perfil as string) === 'POLICIAL';
  }

  get podeVerUsuarios(): boolean {
    return this.isAdmin;
  }

  get podeVerSecoes(): boolean {
    const perfil = this.authService.getUsuario()?.perfil as string | undefined;
    return ['ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE', 'USUARIO_BATALHAO'].includes(perfil ?? '');
  }

  get podeVerAuditoria(): boolean {
    return !this.isUsuarioBatalhao && !this.isPolicial;
  }

  labelPerfil(perfil: string): string {
    const labels: Record<string, string> = {
      ADMIN_DTEC: 'Administrador',
      DIRETORIA: 'Diretoria',
      COMANDANTE: 'Comandante',
      USUARIO_BATALHAO: 'Gestor Batalhão',
      POLICIAL: 'Policial Militar'
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
    if (this.tempoSessao > 2700) {
      return 'safe'; // > 45 min
    } else if (this.tempoSessao > 1800) {
      return 'medium-safe'; // 30 a 45 min
    } else if (this.tempoSessao > 1200) {
      return 'warning'; // 20 a 30 min
    } else if (this.tempoSessao > 600) {
      return 'orange'; // 10 a 20 min
    } else if (this.tempoSessao > 300) {
      return 'danger'; // 5 a 10 min
    } else {
      return 'extreme'; // < 5 min
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
    if (hora >= 0 && hora < 5) {
      this.saudacao = 'Boa Madrugada';
    } else if (hora >= 5 && hora < 12) {
      this.saudacao = 'Bom Dia';
    } else if (hora >= 12 && hora < 18) {
      this.saudacao = 'Boa Tarde';
    } else {
      this.saudacao = 'Boa Noite';
    }
  }

  atualizarTempoSessao() {
    const expTime = this.authService.getTokenExpirationTime();
    if (expTime <= 0) {
      this.tempoSessao = 0;
    } else {
      const remainingMs = expTime - Date.now();
      this.tempoSessao = Math.floor(remainingMs / 1000);
    }
  }

  iniciarTimer() {
    this.intervalId = setInterval(() => {
      this.atualizarTempoSessao();

      if (this.tempoSessao <= 300 && this.tempoSessao > 0) {
        // Faltam 5 minutos ou menos
        if (!this.showModalExpiracao) {
          this.showModalExpiracao = true;
        }
      } else if (this.tempoSessao > 300) {
        // Se a sessão foi renovada, esconde o modal
        this.showModalExpiracao = false;
      }

      if (this.tempoSessao <= 0) {
        clearInterval(this.intervalId);
        this.showModalExpiracao = false;
        this.sair();
      }
    }, 1000);
  }

  pedirMaisTempo() {
    this.renovandoSessao = true;
    this.authService.refresh().subscribe({
      next: () => {
        this.renovandoSessao = false;
        this.showModalExpiracao = false;
        // O timer automaticamente vai reajustar no próximo segundo
      },
      error: () => {
        this.renovandoSessao = false;
        this.sair();
      }
    });
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


