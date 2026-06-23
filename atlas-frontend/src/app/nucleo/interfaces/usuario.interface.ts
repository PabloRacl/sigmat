export type PerfilUsuario = 'ADMIN_DTEC' | 'DIRETORIA' | 'COMANDANTE' | 'USUARIO_BATALHAO';

export interface UsuarioLogado {
  id: number;
  nome: string;
  login: string;
  matricula: string;
  perfil: PerfilUsuario;
  secaoId?: number;
  secaoSigla?: string;
  batalhaoId?: number;
  batalhaoSigla?: string;
  diretoriaId?: number;
  diretoriaSigla?: string;
}

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  matricula: string;
  email?: string;
  perfil: PerfilUsuario;
  secaoId?: number;
  secaoSigla?: string;
  batalhaoId?: number;
  batalhaoSigla?: string;
  diretoriaId?: number;
  diretoriaSigla?: string;
}

export interface UsuarioListagem {
  id: number;
  nome: string;
  login: string;
  matricula: string;
  email?: string;
  postoGraduacao?: string;
  perfil: string;
  secao?: { id: number; sigla: string };
  batalhao?: { id: number; sigla: string };
  [key: string]: unknown;
}
