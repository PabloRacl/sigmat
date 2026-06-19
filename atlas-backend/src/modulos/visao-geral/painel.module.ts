import { Module } from '@nestjs/common';
import { DashboardService } from './painel.service';
import { DashboardController } from './painel.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { PermissoesService } from '../compartilhado/permissoes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService, PermissoesService],
})
export class DashboardModule {}
