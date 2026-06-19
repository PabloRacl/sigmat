import { PerfilUsuario } from '@prisma/client';

export class AtualizarUsuarioDto {
  login?: string;
  matricula?: string;
  nome?: string;
  email?: string;
  postoGraduacao?: string;
  perfil?: PerfilUsuario;
  secaoId?: number;
  batalhaoId?: number;
}
