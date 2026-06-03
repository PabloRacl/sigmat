import { Module } from '@nestjs/common';
import { LoansController } from './cautelas.controller';
import { LoansService } from './cautelas.service';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}





