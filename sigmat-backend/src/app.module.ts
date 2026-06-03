import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './banco-dados/banco-dados.module';
import { LdapModule } from './integracoes/ldap/ldap.module';
import { SgaModule } from './integracoes/sga/sga.module';
import { AuthModule } from './modulos/autenticacao/autenticacao.module';
import { UsersModule } from './modulos/usuarios/usuarios.module';
import { EquipmentModule } from './modulos/equipamentos/equipamentos.module';
import { ApprovalsModule } from './modulos/aprovacoes/aprovacoes.module';
import { LoansModule } from './modulos/cautelas/cautelas.module';
import { ReportsModule } from './modulos/relatorios/relatorios.module';

import { OrgStructureModule } from './modulos/estrutura-organizacional/estrutura-organizacional.module';
import { SettingsModule } from './modulos/configuracoes/configuracoes.module';

import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './modulos/visao-geral/painel.module';
import { TransfersModule } from './modulos/transferencias/transferencias.module';
import { SharedModule } from './compartilhado/shared.module';
import { MaintenanceModule } from './modulos/manutencao/manutencao.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from './modulos/notificacoes/notificacoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    DatabaseModule,

    SharedModule,
    NotificationsModule,
    LdapModule,
    SgaModule,
    AuthModule,
    UsersModule,
    EquipmentModule,
    ApprovalsModule,
    LoansModule,
    ReportsModule,

    OrgStructureModule,
    SettingsModule,
    DashboardModule,
    TransfersModule,
    MaintenanceModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}






