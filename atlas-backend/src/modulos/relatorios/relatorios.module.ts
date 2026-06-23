import { Module } from '@nestjs/common';
import { ReportsController } from './relatorios.controller';
import { ReportsService } from './relatorios.service';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { PermissoesService } from '../compartilhado/permissoes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [ReportsService, PermissoesService],
})
export class ReportsModule {}
