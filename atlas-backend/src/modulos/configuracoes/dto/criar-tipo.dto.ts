import { IsString, IsNotEmpty } from 'class-validator';

export class CriarTipoDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do tipo de equipamento nao pode ser vazio.' })
  nome: string = '';
}
