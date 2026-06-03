import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../servicos/autenticacao.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const usuario = this.authService.getUsuario();
    const perfil = usuario?.perfil;
    const podeAcessar = ['ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE', 'USUARIO_BATALHAO'].includes(perfil);

    if (!podeAcessar) {
      this.router.navigate(['/visao-geral/inicio']);
    }

    return podeAcessar;
  }
}
