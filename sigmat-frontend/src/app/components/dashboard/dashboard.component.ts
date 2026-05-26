import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';
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
  styleUrl: './dashboard.component.scss'
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

  get podeVerAuditoria(): boolean {
    const perfil = this.authService.getUsuario()?.perfil;
    return perfil !== 'USUARIO_BATALHAO';
  }

  sair() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}

