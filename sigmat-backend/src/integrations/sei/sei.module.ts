import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SeiService } from './sei.service';

@Module({
  imports: [HttpModule],
  providers: [SeiService],
  exports: [SeiService],
})
export class SeiModule {}





