import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que utiliza a estratégia "local" (LocalStrategy) para autenticação.
 * Basta aplicar @UseGuards(LocalAuthGuard) em um endpoint de login.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
