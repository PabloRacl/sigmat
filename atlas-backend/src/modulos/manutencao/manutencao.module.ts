import { Module } from '@nestjs/common';
import { MaintenanceService } from './manutencao.service';
import { MaintenanceController } from './manutencao.controller';
import { MaintenanceRepository } from './manutencao.repository';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { NotificationsModule } from '../notificacoes/notificacoes.module';
import { PermissoesService } from '../compartilhado/permissoes.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository, PermissoesService],
})
export class MaintenanceModule {}
