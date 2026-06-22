import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BasesCorporativasService } from './bases-corporativas.service';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Module({
  imports: [HttpModule, DatabaseModule],
  providers: [BasesCorporativasService],
  exports: [BasesCorporativasService],
})
export class SgaModule {}

