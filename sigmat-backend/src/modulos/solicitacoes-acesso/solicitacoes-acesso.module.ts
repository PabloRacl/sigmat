import { Module } from '@nestjs/common';
import { AccessRequestsService } from './solicitacoes-acesso.service';
import { AccessRequestsRepository } from './solicitacoes-acesso.repository';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { AccessRequestsController } from './solicitacoes-acesso.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AccessRequestsController],
  providers: [AccessRequestsService, AccessRequestsRepository],
  exports: [AccessRequestsService],
})
export class AccessRequestsModule {}
