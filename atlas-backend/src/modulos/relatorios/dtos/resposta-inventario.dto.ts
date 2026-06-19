import { TipoDto } from './tipo.dto';
import { MarcaDto } from './marca.dto';
import { ModeloDto } from './modelo.dto';
import { StatusDto } from './status.dto';
import { DisponibilidadeDto } from './disponibilidade.dto';
import { SecaoDto } from './secao.dto';

export class RespostaInventarioDto {
  id!: number;
  patrimonio!: string;
  numeroSerie!: string;
  sei!: string;
  dataAquisicao!: Date;
  observacao?: string;
  solicitante?: string;
  dataSolicitacao?: Date;
  dataRetornoEmprestimo?: Date;

  tipoEquipamento!: TipoDto;
  marca!: MarcaDto;
  modelo!: ModeloDto;
  status!: StatusDto;
  tipoAquisicao!: TipoDto; // reutiliza o mesmo TipoDto
  disponibilidade!: DisponibilidadeDto;

  secao!: SecaoDto;
}
