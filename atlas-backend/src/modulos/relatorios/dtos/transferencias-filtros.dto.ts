export class TransferenciasFiltrosDto {
  origemId?: number;
  destinoId?: number;
  status?: string;
  patrimonio?: string;
  solicitante?: string;
  recebedor?: string;
  dataEnvioInicio?: string; // ISO date string
  dataEnvioFim?: string;
  dataRecebimentoInicio?: string;
  dataRecebimentoFim?: string;
  lote?: string;
}
