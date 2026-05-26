import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SgaService } from './sga.service';

@Module({
  imports: [HttpModule],
  providers: [SgaService],
  exports: [SgaService],
})
export class SgaModule {}
