export interface SecaoPermitida {
  secaoId: number;
}

export interface BatalhaoPermitido {
  batalhaoId: number;
}

export interface UsuarioLogado {
  id: number;
  cpf: string;
  nome: string;
  papel: string;
  perfil: string;
  postoGraduacao?: string;
  secaoId?: number;
  batalhaoId?: number;
  diretoriaId?: number;
  secoesPermitidas: SecaoPermitida[];
  batalhoesPermitidos: BatalhaoPermitido[];
}
