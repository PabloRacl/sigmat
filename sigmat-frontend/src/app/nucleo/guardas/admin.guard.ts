import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../servicos/autenticacao.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const usuario = this.authService.getUsuario();
    const isAdmin = usuario?.perfil === 'ADMIN_DTEC';

    if (!isAdmin) {
      this.router.navigate(['/visao-geral/inicio']);
    }

    return isAdmin;
  }
}
