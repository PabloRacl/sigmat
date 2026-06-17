import { Module } from '@nestjs/common';
import { ApprovalsService } from './aprovacoes.service';
import { ApprovalsController } from './aprovacoes.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { SharedModule } from '../../compartilhado/shared.module';
import { NotificationsModule } from '../notificacoes/notificacoes.module';
import { I_APROVACAO_REPOSITORIO } from './repositorios/aprovacoes.repository.interface';
import { AprovacaoRepositorioPrisma } from './repositorios/aprovacoes.repository.prisma';

@Module({
  imports: [DatabaseModule, SharedModule, NotificationsModule],
  controllers: [ApprovalsController],
  providers: [
    ApprovalsService,
    {
      provide: I_APROVACAO_REPOSITORIO,
      useClass: AprovacaoRepositorioPrisma,
    }
  ],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}





