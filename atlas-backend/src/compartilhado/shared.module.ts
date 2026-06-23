import { Global, Module } from '@nestjs/common';
import { AuditService } from './servicos/audit.service';
import { DatabaseModule } from '../banco-dados/banco-dados.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class SharedModule {}
