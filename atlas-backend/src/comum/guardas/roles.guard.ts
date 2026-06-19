/**
 * [Estado Atual]: Guard de controle de acesso por perfil (RBAC).
 * [Dependências Técnicas]: Reflector (metadados), PerfilUsuario (Prisma)
 * [Regras de Negócio Imutáveis]:
 *   - Se nenhum perfil for definido via @Roles(), a rota é pública para qualquer autenticado.
 *   - Se perfis forem definidos, apenas usuários com aquele perfil podem acessar.
 */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se nenhum @Roles() foi definido, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.perfil);
  }
}
