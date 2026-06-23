import { PerfilUsuario } from '@prisma/client';

export class CriarUsuarioDto {
  login: string = '';
  matricula: string = '';
  nome: string = '';
  email?: string;
  postoGraduacao?: string;
  perfil: PerfilUsuario = PerfilUsuario.USUARIO_BATALHAO;
  secaoId?: number;
  batalhaoId?: number;
}
