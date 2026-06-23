import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ValidacaoLdapService } from './validacao-ldap.service';

@Module({
  imports: [HttpModule],
  providers: [ValidacaoLdapService],
  exports: [ValidacaoLdapService],
})
export class LdapModule {}
