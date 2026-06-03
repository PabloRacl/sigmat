import { Module, Global } from '@nestjs/common';
import { NotificationsGateway } from './notificacoes.gateway';
import { NotificationsService } from './notificacoes.service';

@Global()
@Module({
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
