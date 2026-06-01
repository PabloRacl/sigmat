import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
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

  get podeVerUsuarios(): boolean {
    return !this.isUsuarioBatalhao;
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


