import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'qrcode/:id',
    loadComponent: () => import('./components/mobile-qrcode/mobile-qrcode.component').then(m => m.MobileQrcodeComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./components/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'equipment',
        loadComponent: () => import('./components/equipment-list/equipment-list.component').then(m => m.EquipmentListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users-list/users-list.component').then(m => m.UsersListComponent)
      },
      {
        path: 'loans',
        loadComponent: () => import('./components/loans-management/loans-management.component').then(m => m.LoansManagementComponent)
      },
      {
        path: 'approvals',
        loadComponent: () => import('./components/approvals-list/approvals-list.component').then(m => m.ApprovalsListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'transfers',
        loadComponent: () => import('./components/transfers-list/transfers-list.component').then(m => m.TransfersListComponent)
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./components/maintenance-list/maintenance-list.component').then(m => m.MaintenanceListComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./components/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];

