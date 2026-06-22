import { Module } from '@nestjs/common';
import { LoansController } from './cautelas.controller';
import { LoansService } from './cautelas.service';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

import { I_LOANS_REPOSITORY } from './repositorios/cautelas.repository.interface';
import { LoansRepository } from './repositorios/cautelas.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [LoansController],
  providers: [
    LoansService,
    {
      provide: I_LOANS_REPOSITORY,
      useClass: LoansRepository,
    },
  ],
})
export class LoansModule {}
