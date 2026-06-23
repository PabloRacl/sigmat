import { IsString, IsInt, IsOptional } from 'class-validator';

export class AtualizarSecaoDto {
  @IsString()
  @IsOptional()
  sigla?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsInt()
  @IsOptional()
  batalhaoId?: number;

  @IsInt()
  @IsOptional()
  diretoriaId?: number;
}
