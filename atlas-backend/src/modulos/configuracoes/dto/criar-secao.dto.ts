import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CriarSecaoDto {
  @IsString()
  @IsNotEmpty()
  sigla: string = '';

  @IsString()
  @IsNotEmpty()
  nome: string = '';

  @IsInt()
  @IsOptional()
  batalhaoId?: number;

  @IsInt()
  @IsOptional()
  diretoriaId?: number;
}
