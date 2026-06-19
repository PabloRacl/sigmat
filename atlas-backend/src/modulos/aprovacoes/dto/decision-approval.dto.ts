import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class DecisionApprovalDto {
  @IsBoolean()
  aprovado!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'A justificativa deve ter no máximo 500 caracteres',
  })
  justificativa?: string;
}
