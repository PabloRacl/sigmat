import { Module } from '@nestjs/common';
import { EquipmentController } from './materiais.controller';
import { EquipmentService } from './materiais.service';
import { EquipmentRepository } from './materiais.repository';
import { CarregamentoController } from './carregamento.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { ApprovalsModule } from '../aprovacoes/aprovacoes.module';

@Module({
  imports: [DatabaseModule, ApprovalsModule],
  controllers: [EquipmentController, CarregamentoController],
  providers: [EquipmentService, EquipmentRepository],
  exports: [EquipmentService],
})
export class EquipmentModule {}
