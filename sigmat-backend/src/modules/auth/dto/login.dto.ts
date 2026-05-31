import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'O usuário é obrigatório' })
  usuario: string = '';

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  senha: string = '';
}





