import { Routes } from '@angular/router';
import { authGuard, adminGuard, reconGuard } from './guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'change-password',
    loadComponent: () =>
      import('./pages/change-password/change-password.component')
        .then(m => m.ChangePasswordComponent)
  },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./pages/import/import.component').then(m => m.ImportComponent)
      },
      {
        path: 'reconciliation',
        loadComponent: () =>
          import('./pages/reconciliation/reconciliation.component')
            .then(m => m.ReconciliationComponent),
        canActivate: [reconGuard]
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component')
            .then(m => m.ReportsComponent),
        canActivate: [reconGuard]
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./pages/admin/users/users.component')
            .then(m => m.UsersComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/config',
        loadComponent: () =>
          import('./pages/admin/config/config.component')
            .then(m => m.ConfigComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/audit',
        loadComponent: () =>
          import('./pages/admin/audit/audit.component')
            .then(m => m.AuditComponent),
        canActivate: [adminGuard]
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
