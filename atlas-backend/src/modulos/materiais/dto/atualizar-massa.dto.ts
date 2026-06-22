import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class AtualizarMassaDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[] = [];

  @IsObject()
  dados: {
    statusId?: number;
    secaoId?: number;
    disponibilidadeId?: number;
    tipoAquisicaoId?: number;
    observacao?: string;
  } = {};
}
