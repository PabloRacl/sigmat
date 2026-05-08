import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MobileQrcodeComponent } from './components/mobile-qrcode/mobile-qrcode.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EquipmentListComponent } from './components/equipment-list/equipment-list.component';
import { DashboardHomeComponent } from './components/dashboard-home/dashboard-home.component';
import { UsersListComponent } from './components/users-list/users-list.component';
import { LoansManagementComponent } from './components/loans-management/loans-management.component';
import { ApprovalsListComponent } from './components/approvals-list/approvals-list.component';
import { ReportsComponent } from './components/reports/reports.component';
import { TransfersListComponent } from './components/transfers-list/transfers-list.component';
import { MaintenanceListComponent } from './components/maintenance-list/maintenance-list.component';
import { AuditLogsComponent } from './components/audit-logs/audit-logs.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'qrcode/:id', component: MobileQrcodeComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    children: [
      { path: 'home', component: DashboardHomeComponent },
      { path: 'equipment', component: EquipmentListComponent },
      { path: 'users', component: UsersListComponent },
      { path: 'loans', component: LoansManagementComponent },
      { path: 'approvals', component: ApprovalsListComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'transfers', component: TransfersListComponent },
      { path: 'maintenance', component: MaintenanceListComponent },
      { path: 'audit', component: AuditLogsComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
];

