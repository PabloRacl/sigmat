import { PartialType } from '@nestjs/mapped-types';
import { CriarEquipamentoDto } from './criar-equipamento.dto';

/**
 * DTO para atualização de um equipamento existente.
 * Utiliza o PartialType para tornar todos os campos do CriarEquipamentoDto opcionais.
 */
export class AtualizarEquipamentoDto extends PartialType(CriarEquipamentoDto) {}
