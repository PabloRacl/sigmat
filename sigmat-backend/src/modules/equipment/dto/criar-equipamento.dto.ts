import { IsString, IsOptional, IsInt, IsDateString, IsNotEmpty, IsObject, IsNumber } from 'class-validator';

/**
 * DTO para criação de um novo equipamento.
 * Todos os campos seguem o padrão do schema do Prisma em português.
 */
export class CriarEquipamentoDto {
  @IsString()
  @IsNotEmpty({ message: 'O patrimônio é obrigatório' })
  patrimonio: string;

  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsString()
  @IsOptional()
  sei?: string;

  @IsDateString({}, { message: 'Data de aquisição inválida' })
  @IsOptional()
  dataAquisicao?: string;

  @IsNumber({}, { message: 'O valor deve ser um número' })
  @IsOptional()
  valor?: number;

  @IsString()
  @IsOptional()
  observacao?: string;

  @IsInt({ message: 'ID do tipo de equipamento deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O tipo de equipamento é obrigatório' })
  tipoEquipamentoId: number;

  @IsInt()
  @IsOptional()
  marcaId?: number;

  @IsInt()
  @IsOptional()
  modeloId?: number;

  @IsInt({ message: 'ID do status deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O status do equipamento é obrigatório' })
  statusId: number;

  @IsInt()
  @IsOptional()
  tipoAquisicaoId?: number;

  @IsInt({ message: 'ID da disponibilidade deve ser um número inteiro' })
  @IsNotEmpty({ message: 'A disponibilidade do equipamento é obrigatória' })
  disponibilidadeId: number;

  @IsInt({ message: 'ID da seção deve ser um número inteiro' })
  @IsNotEmpty({ message: 'A seção do equipamento é obrigatória' })
  secaoId: number;

  @IsInt()
  @IsOptional()
  usuarioResponsavelId?: number;

  @IsObject()
  @IsOptional()
  especificacoes?: any;
  @IsOptional()
  @IsString()
  solicitante?: string;

  @IsOptional()
  @IsString()
  dataSolicitacao?: string;

  @IsOptional()
  @IsString()
  dataRetornoEmprestimo?: string;

  @IsOptional()
  fotos?: any;
}





