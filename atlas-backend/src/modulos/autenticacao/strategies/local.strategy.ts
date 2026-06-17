import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../autenticacao.service';

/**
 * Estratégia local que delega a autenticação ao AuthService.loginCorporativo.
 * O método `validate` recebe `username` e `password` (renomeados para `usuario` e `senha`).
 * Caso a autenticação falhe, lança UnauthorizedException.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // O campo “usernameField” corresponde ao nome do campo enviado no body.
    super({ usernameField: 'usuario', passwordField: 'senha' });
  }

  async validate(usuario: string, senha: string) {
    try {
      // Reutiliza a lógica de login corporativo já existente.
      const result = await this.authService.loginCorporativo(usuario, senha);
      // O Passport espera que o objeto retornado seja o “user".
      return result;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error.message || 'Credenciais inválidas');
    }
  }
}
