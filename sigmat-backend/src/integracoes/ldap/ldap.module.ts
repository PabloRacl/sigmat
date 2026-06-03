import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LdapService } from './ldap.service';

@Module({
  imports: [HttpModule],
  providers: [LdapService],
  exports: [LdapService],
})
export class LdapModule {}
