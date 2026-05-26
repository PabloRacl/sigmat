import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LdapModule } from './integrations/ldap/ldap.module';
import { SgaModule } from './integrations/sga/sga.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { LoansModule } from './modules/loans/loans.module';
import { ReportsModule } from './modules/reports/reports.module';

import { OrgStructureModule } from './modules/org-structure/org-structure.module';
import { SettingsModule } from './modules/settings/settings.module';

import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { SharedModule } from './shared/shared.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from './modules/notifications/notifications.module';

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






