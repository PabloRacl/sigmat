import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AuthService } from './autenticacao.service';
import { AuthRepository } from './autenticacao.repository';
import { AuthController } from './autenticacao.controller';
import { UsersModule } from '../usuarios/usuarios.module';
import { LdapModule } from '../../integracoes/ldap/ldap.module';
import { SgaModule } from '../../integracoes/sga/sga.module';
import { JwtStrategy } from './jwt.strategy';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';
import { AccessRequestsModule } from '../solicitacoes-acesso/solicitacoes-acesso.module';

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
        if (!secret) throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
        return { secret, signOptions: { expiresIn: '8h' } };
      },
    }),
  ],
  providers: [AuthService, AuthRepository, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}





