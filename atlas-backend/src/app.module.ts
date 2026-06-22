import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './banco-dados/banco-dados.module';
import { LdapModule } from './integracoes/validacao-ldap/validacao-ldap.module';
import { SgaModule } from './integracoes/bases-corporativas/bases-corporativas.module';
import { AcessoModule } from './modulos/acesso/acesso.module';
import { UsersModule } from './modulos/pessoal/pessoal.module';
import { EquipmentModule } from './modulos/materiais/materiais.module';
import { ApprovalsModule } from './modulos/aprovacoes/aprovacoes.module';
import { LoansModule } from './modulos/cautelas/cautelas.module';
import { ReportsModule } from './modulos/relatorios/relatorios.module';

import { OrgStructureModule } from './modulos/estrutura-organizacional/estrutura-organizacional.module';
import { SettingsModule } from './modulos/configuracoes/configuracoes.module';

import { ConfigModule } from '@nestjs/config';
import { DashboardModule as PainelModule } from './modulos/visao-geral/painel.module';
import { TransfersModule } from './modulos/movimentacoes/movimentacoes.module';
import { SharedModule } from './compartilhado/shared.module';
import { MaintenanceModule } from './modulos/assistencia-tecnica/assistencia-tecnica.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from './modulos/notificacoes/notificacoes.module';
import { PdfModule } from './modulos/pdf/pdf.module';
import { HealthModule } from './health/health.module';
import { ImportacaoModule } from './modulos/importacao/importacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Ajustado para 100 requisições por minuto para não quebrar dashboards, porém prevenindo DoS
      },
    ]),
    DatabaseModule,

    SharedModule,
    NotificationsModule,
    LdapModule,
    SgaModule,
    AcessoModule,
    UsersModule,
    EquipmentModule,
    ApprovalsModule,
    LoansModule,
    ReportsModule,
    PdfModule,

    OrgStructureModule,
    SettingsModule,
    PainelModule,
    TransfersModule,
    MaintenanceModule,
    HealthModule,
    ImportacaoModule,
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
