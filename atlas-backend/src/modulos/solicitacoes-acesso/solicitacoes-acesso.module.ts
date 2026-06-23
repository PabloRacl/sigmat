import { Module } from '@nestjs/common';
import { AccessRequestsService } from './solicitacoes-acesso.service';
import { AccessRequestsRepository } from './solicitacoes-acesso.repository';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { AccessRequestsController } from './solicitacoes-acesso.controller';
import { SgaModule } from '../../integracoes/bases-corporativas/bases-corporativas.module';

@Module({
  imports: [DatabaseModule, SgaModule],
  controllers: [AccessRequestsController],
  providers: [AccessRequestsService, AccessRequestsRepository],
  exports: [AccessRequestsService],
})
export class AccessRequestsModule {}
