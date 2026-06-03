import { Module } from '@nestjs/common';
import { ApprovalsService } from './aprovacoes.service';
import { ApprovalsController } from './aprovacoes.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { SharedModule } from '../../compartilhado/shared.module';
import { NotificationsModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [DatabaseModule, SharedModule, NotificationsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}





