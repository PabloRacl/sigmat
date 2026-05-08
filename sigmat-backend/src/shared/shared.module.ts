import { Global, Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class SharedModule {}





