import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { UsersModule } from '../pessoal/pessoal.module';
import { LdapModule } from '../../integracoes/validacao-ldap/validacao-ldap.module';
import { SgaModule } from '../../integracoes/bases-corporativas/bases-corporativas.module';
import { AccessRequestsModule } from '../solicitacoes-acesso/solicitacoes-acesso.module';
import { AcessoService } from './acesso.service';
import { AuthRepository } from './acesso.repository';
import { AcessoController } from './acesso.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    LdapModule,
    SgaModule,
    AccessRequestsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET não está definido nas variáveis de ambiente',
          );
        }
        return { secret, signOptions: { expiresIn: '60m' } };
      },
    }),
  ],
  providers: [AcessoService, AuthRepository, JwtStrategy, LocalStrategy],
  controllers: [AcessoController],
  exports: [AcessoService, AuthRepository],
})
export class AcessoModule {}
