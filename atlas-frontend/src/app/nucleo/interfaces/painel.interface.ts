export interface GraficoDataset {
  label?: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
  borderWidth?: number;
}

export interface GraficoData {
  labels: string[];
  datasets: GraficoDataset[];
}

export interface ResumoDashboard {
  total: number;
  ativos: number;
  inativos: number;
  emprestados: number;
  manutencao: number;
  [key: string]: number;
}

export interface GraficosDashboard {
  porStatus: GraficoData;
  porDisponibilidade: GraficoData;
  porTipo: GraficoData;
  [key: string]: GraficoData;
}

export interface EstatisticasDashboard {
  resumo: ResumoDashboard;
  graficos: GraficosDashboard;
}

export interface AtividadeDashboard {
  id: number;
  acao: string;
  descricao?: string;
  detalhe?: string;
  dataHora?: Date;
  createdAt?: Date;
  usuario?: { nome: string };
}
