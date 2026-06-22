import { Module } from '@nestjs/common';
import { TransfersController } from './movimentacoes.controller';
import { TransfersService } from './movimentacoes.service';
import { TransfersRepository } from './movimentacoes.repository';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { SharedModule } from '../../compartilhado/shared.module';
import { NotificationsModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [DatabaseModule, SharedModule, NotificationsModule],
  controllers: [TransfersController],
  providers: [TransfersService, TransfersRepository],
  exports: [TransfersService, TransfersRepository],
})
export class TransfersModule {}
