import { Module, Global } from '@nestjs/common';
import { NotificationsGateway } from './notificacoes.gateway';
import { NotificationsService } from './notificacoes.service';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

