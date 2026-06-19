export type PerfilUsuario = 'ADMIN_DTEC' | 'DIRETORIA' | 'COMANDANTE' | 'USUARIO_BATALHAO';

export interface Usuario {
  id: number;
  login: string;
  nome: string;
  matricula: string;
  perfil: PerfilUsuario;
  email?: string;
  postoGraduacao?: string;
  secaoId?: number;
  secaoSigla?: string;
  secaoNome?: string;
  batalhaoId?: number;
  batalhaoSigla?: string;
  batalhaoNome?: string;
  diretoriaId?: number;
  diretoriaSigla?: string;
  diretoriaNome?: string;
}
