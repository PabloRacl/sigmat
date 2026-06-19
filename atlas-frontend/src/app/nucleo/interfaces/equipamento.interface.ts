export interface TipoEquipamento {
  id: number;
  nome: string;
}

export interface Marca {
  id: number;
  nome: string;
}

export interface Modelo {
  id: number;
  nome: string;
  marcaId: number;
}

export interface StatusEquipamento {
  id: number;
  nome: string;
}

export interface Disponibilidade {
  id: number;
  nome: string;
}

export interface Diretoria {
  id: number;
  sigla: string;
  nome: string;
}

export interface Batalhao {
  id: number;
  sigla: string;
  nome: string;
  diretoria?: Diretoria;
}

export interface Secao {
  id: number;
  sigla: string;
  nome: string;
  batalhao?: Batalhao;
  diretoria?: Diretoria;
}

export interface Equipamento {
  id: number;
  patrimonio: string;
  numeroSerie?: string;
  sei?: string;
  dataAquisicao?: string;
  observacao?: string;
  tipoEquipamento: TipoEquipamento;
  marca?: Marca;
  modelo?: Modelo;
  status: StatusEquipamento;
  disponibilidade: Disponibilidade;
  secao: Secao;
  solicitante?: string;
  dataSolicitacao?: string;
  dataRetornoEmprestimo?: string;
  especificacoes?: any;
  fotos?: any;
  usuarioResponsavelId?: number;
  valor?: number;
}
