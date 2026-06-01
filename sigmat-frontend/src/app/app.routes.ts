import { Routes } from '@angular/router';
import { AdminGuard } from './core/guards/admin.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'qrcode/:id',
    loadComponent: () => import('./features/mobile/mobile-qrcode/mobile-qrcode.component').then(m => m.MobileQrcodeComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'equipment',
        loadComponent: () => import('./features/equipment/equipment-list/equipment-list.component').then(m => m.EquipmentListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users-list/users-list.component').then(m => m.UsersListComponent),
        canActivate: [AdminGuard]
      },
      {
        path: 'loans',
        loadComponent: () => import('./features/loans/loans-management/loans-management.component').then(m => m.LoansManagementComponent)
      },
      {
        path: 'approvals',
        loadComponent: () => import('./features/approvals/approvals-list/approvals-list.component').then(m => m.ApprovalsListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'secoes',
        loadComponent: () => import('./features/settings/sections/sections.component').then(m => m.SettingsSectionsComponent),
        canActivate: [RoleGuard]
      },
      {
        path: 'transfers',
        loadComponent: () => import('./features/transfers/transfers-list/transfers-list.component').then(m => m.TransfersListComponent)
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./features/maintenance/maintenance-list/maintenance-list.component').then(m => m.MaintenanceListComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
