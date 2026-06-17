import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { NotificationsService } from '../../../nucleo/servicos/notificacoes.service';
import { Observable } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, InputTextModule, ButtonModule, BadgeModule, TooltipModule, RippleModule],
  templateUrl: './painel.component.html',
  styleUrls: ['./painel.component.scss']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);

  usuario$!: Observable<any>;
  totalPendentes = 0;
  isSidebarCollapsed = false;
  termoBusca: string = '';

  ngOnInit(): void {
    this.usuario$ = this.authService.usuario$;
    
    this.notificationsService.pendentes$.subscribe(total => {
      this.totalPendentes = total;
    });

    // Carga inicial
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

  sair() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}


