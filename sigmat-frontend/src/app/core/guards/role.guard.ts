import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const usuario = this.authService.getUsuario();
    const perfil = usuario?.perfil;
    const podeAcessar = ['ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE'].includes(perfil);

    if (!podeAcessar) {
      this.router.navigate(['/dashboard/home']);
    }

    return podeAcessar;
  }
}
