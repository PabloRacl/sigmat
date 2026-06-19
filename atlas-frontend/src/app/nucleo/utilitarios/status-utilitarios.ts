export type SeveridadeStatus = 'sucesso' | 'atencao' | 'perigo' | 'info' | 'neutro';

type TipoIndicador = 'status' | 'disponibilidade' | 'transferencia';

const MAPA_STATUS: Record<string, SeveridadeStatus> = {
  ATIVO: 'sucesso',
  DISPONIVEL: 'sucesso',
  MANUTENCAO: 'atencao',
  PENDENTE_APROVACAO: 'atencao',
  INATIVO: 'perigo',
  EXTRAVIADO: 'perigo',
  DANO: 'perigo',
};

const MAPA_DISPONIBILIDADE: Record<string, SeveridadeStatus> = {
  CARGA: 'sucesso',
  DISPONIVEL: 'info',
  EMPRESTIMO: 'atencao',
};

const MAPA_TRANSFERENCIA: Record<string, SeveridadeStatus> = {
  CONCLUIDA: 'sucesso',
  PENDENTE: 'atencao',
  CANCELADA: 'perigo',
};

const MAPAS: Record<TipoIndicador, Record<string, SeveridadeStatus>> = {
  status: MAPA_STATUS,
  disponibilidade: MAPA_DISPONIBILIDADE,
  transferencia: MAPA_TRANSFERENCIA,
};

export function severidadeStatus(valor: string | undefined | null, tipo: TipoIndicador = 'status'): SeveridadeStatus {
  const chave = (valor ?? '').toUpperCase().trim();
  return MAPAS[tipo][chave] ?? 'neutro';
}
