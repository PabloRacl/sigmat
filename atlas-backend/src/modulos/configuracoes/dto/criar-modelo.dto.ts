import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CriarModeloDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do modelo nao pode ser vazio.' })
  nome: string = '';

  @IsInt()
  @IsOptional()
  marcaId?: number;
}
