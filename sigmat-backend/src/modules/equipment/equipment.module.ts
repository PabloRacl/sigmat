import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentRepository } from './equipment.repository';
import { UploadController } from './upload.controller';
import { DatabaseModule } from '../../database/database.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [DatabaseModule, ApprovalsModule],
  controllers: [EquipmentController, UploadController],
  providers: [EquipmentService, EquipmentRepository],
  exports: [EquipmentService],
})
export class EquipmentModule {}





