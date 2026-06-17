import { Module } from '@nestjs/common';
import { EquipmentController } from './equipamentos.controller';
import { EquipmentService } from './equipamentos.service';
import { EquipmentRepository } from './equipamentos.repository';
import { UploadController } from './carregamento.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { ApprovalsModule } from '../aprovacoes/aprovacoes.module';

@Module({
  imports: [DatabaseModule, ApprovalsModule],
  controllers: [EquipmentController, UploadController],
  providers: [EquipmentService, EquipmentRepository],
  exports: [EquipmentService],
})
export class EquipmentModule {}





