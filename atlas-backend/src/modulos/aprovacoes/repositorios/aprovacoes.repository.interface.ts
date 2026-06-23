export interface IAprovacaoRepositorio {
  criar(
    equipamentoId: number,
    solicitanteId: number,
    dadosNovos: any,
    dadosAntigos: any,
    camposAlterados: string[],
  ): Promise<any>;
  listarPendentesPorUnidade(batalhaoId?: number): Promise<any[]>;
  listarTodas(): Promise<any[]>;
  contarPendentes(batalhaoId?: number): Promise<number>;
  obterPendencia(id: number): Promise<any>;
  processarDecisao(
    id: number,
    aprovado: boolean,
    aprovadoPorId: number,
    motivoNegacao?: string,
    dadosTransacao?: any,
  ): Promise<any>;
}
export const I_APROVACAO_REPOSITORIO = 'IAprovacaoRepositorio';
