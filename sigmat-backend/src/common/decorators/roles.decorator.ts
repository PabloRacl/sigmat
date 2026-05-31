import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/roles.guard';

/**
 * Decorator para restringir acesso por perfil.
 * Uso: @Roles('ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
