import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'O usuário é obrigatório' })
  usuario: string = '';

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  senha: string = '';
}

export class SolicitarAcessoDto {
  @IsString()
  @IsNotEmpty({ message: 'O usuário é obrigatório' })
  usuario: string = '';

  @IsString()
  @IsNotEmpty({ message: 'A matrícula é obrigatória' })
  matricula: string = '';

  @IsString()
  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  cpf: string = '';


  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string = '';

  @IsString()
  @IsNotEmpty({ message: 'A unidade é obrigatória' })
  unidade: string = '';

  @IsString()
  @IsNotEmpty({ message: 'O motivo da solicitação é obrigatório' })
  motivo: string = '';
}
