export const I_LOANS_REPOSITORY = 'ILoansRepository';

export interface ILoansRepository {
  listarEmprestados(): Promise<any[]>;
  historico(): Promise<any[]>;
  buscarPorId(id: number): Promise<any>;
  obterDisponibilidadeId(nome: string): Promise<number | null>;
  atualizar(id: number, data: any): Promise<any>;
  listarVencidos(): Promise<any[]>;
}
