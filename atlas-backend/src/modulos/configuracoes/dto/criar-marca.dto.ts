import { IsString, IsNotEmpty } from 'class-validator';

export class CriarMarcaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da marca nao pode ser vazio.' })
  nome: string = '';
}
