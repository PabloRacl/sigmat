import { Module } from '@nestjs/common';
import { MaintenanceService } from './assistencia-tecnica.service';
import { MaintenanceController } from './assistencia-tecnica.controller';
import { MaintenanceRepository } from './assistencia-tecnica.repository';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { NotificationsModule } from '../notificacoes/notificacoes.module';
import { PermissoesService } from '../compartilhado/permissoes.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository, PermissoesService],
})
export class MaintenanceModule {}
