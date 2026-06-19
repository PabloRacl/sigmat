import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../servicos/autenticacao.service';
import { PerfilUsuario } from '../interfaces/usuario.interface';
import { ROTAS } from '../utilitarios/rotas.constantes';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const usuario = this.authService.getUsuario();
    const perfisPermitidos = (route.data?.['perfis'] as PerfilUsuario[]) ?? [];
    const perfil = usuario?.perfil as PerfilUsuario;

    if (!perfisPermitidos.length || perfisPermitidos.includes(perfil)) {
      return true;
    }

    this.router.navigate([ROTAS.INICIO]);
    return false;
  }
}
