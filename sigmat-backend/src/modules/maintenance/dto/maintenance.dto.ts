import { IsInt, IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { StatusManutencao } from '@prisma/client';

export class CriarOrdemServicoDto {
  @IsInt()
  @IsNotEmpty({ message: 'O ID do equipamento é obrigatório' })
  equipamentoId: number;

  @IsString()
  @IsNotEmpty({ message: 'A descrição do problema é obrigatória' })
  descricaoProblema: string;

  @IsString()
  @IsOptional()
  tecnicoResponsavel?: string;

  @IsDateString()
  @IsOptional()
  dataPrevisao?: string;
}

export class AtualizarStatusOsDto {
  @IsEnum(StatusManutencao, { message: 'Status de manutenção inválido' })
  @IsNotEmpty()
  status: StatusManutencao;

  @IsString()
  @IsOptional()
  solucaoAplicada?: string;

  @IsNumber({}, { message: 'O valor deve ser um número' })
  @IsOptional()
  valorGasto?: number;

  @IsDateString()
  @IsOptional()
  dataConclusao?: string;
}





