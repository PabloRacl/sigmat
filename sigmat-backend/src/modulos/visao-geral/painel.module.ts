import { Module } from '@nestjs/common';
import { DashboardService } from './painel.service';
import { DashboardController } from './painel.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}





