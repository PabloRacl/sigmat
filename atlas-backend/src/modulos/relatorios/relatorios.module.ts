import { Module } from '@nestjs/common';
import { ReportsController } from './relatorios.controller';
import { ReportsService } from './relatorios.service';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}





