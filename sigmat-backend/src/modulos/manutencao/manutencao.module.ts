import { Module } from '@nestjs/common';
import { MaintenanceService } from './manutencao.service';
import { MaintenanceController } from './manutencao.controller';
import { MaintenanceRepository } from './manutencao.repository';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { NotificationsModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository]
})
export class MaintenanceModule {}






