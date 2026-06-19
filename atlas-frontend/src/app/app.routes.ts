import { Routes } from '@angular/router';
import { RoleGuard } from './nucleo/guardas/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./funcionalidades/autenticacao/entrada/entrada.component').then(m => m.LoginComponent)
  },
  {
    path: 'qrcode/:id',
    loadComponent: () => import('./funcionalidades/celular/qrcode-movel/qr-movel.component').then(m => m.MobileQrcodeComponent)
  },
  {
    path: 'visao-geral',
    loadComponent: () => import('./funcionalidades/visao-geral/painel/painel.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./funcionalidades/visao-geral/inicio/visao-inicial.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'equipamentos',
        loadComponent: () => import('./funcionalidades/equipamentos/lista/lista-equipamentos.component').then(m => m.EquipmentListComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./funcionalidades/usuarios/lista/lista-usuarios.component').then(m => m.UsersListComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC'] }
      },
      {
        path: 'cautelas',
        loadComponent: () => import('./funcionalidades/cautelas/gestao/gestao-cautelas.component').then(m => m.LoansManagementComponent)
      },
      {
        path: 'aprovacoes',
        loadComponent: () => import('./funcionalidades/aprovacoes/lista/lista-aprovacoes.component').then(m => m.ApprovalsListComponent)
      },
      {
        path: 'relatorios',
        loadComponent: () => import('./funcionalidades/relatorios/lista/relatorios.component').then(m => m.ReportsComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE'] }
      },
      {
        path: 'tabelas-basicas/secoes',
        loadComponent: () => import('./funcionalidades/configuracoes/secoes/secoes.component').then(m => m.SettingsSectionsComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC', 'DIRETORIA'] }
      },
      {
        path: 'secoes',
        redirectTo: 'tabelas-basicas/secoes'
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./funcionalidades/configuracoes/secoes/secoes.component').then(m => m.SettingsSectionsComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC', 'DIRETORIA'] }
      },
      {
        path: 'transferencias',
        loadComponent: () => import('./funcionalidades/transferencias/lista/lista-transferencias.component').then(m => m.TransfersListComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE'] }
      },
      {
        path: 'tabelas-basicas/:entidade',
        loadComponent: () => import('./funcionalidades/configuracoes/tabelas-basicas/tabelas-basicas.component').then(m => m.TabelasBasicasComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC'] }
      },
      {
        path: 'manutencao',
        loadComponent: () => import('./funcionalidades/manutencao/lista/lista-manutencao.component').then(m => m.MaintenanceListComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC', 'DIRETORIA', 'COMANDANTE'] }
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./funcionalidades/auditoria/registros/registros-auditoria.component').then(m => m.AuditLogsComponent),
        canActivate: [RoleGuard],
        data: { perfis: ['ADMIN_DTEC', 'DIRETORIA'] }
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  }
];
