import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'import', loadComponent: () => import('./pages/import/import.component').then(m => m.ImportComponent) },
      { path: 'reconciliation', loadComponent: () => import('./pages/reconciliation/reconciliation.component').then(m => m.ReconciliationComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'search', loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent) },
      { path: 'compare', loadComponent: () => import('./pages/compare/compare.component').then(m => m.CompareComponent) },
      { path: 'change-password', loadComponent: () => import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
      { path: 'admin/users', loadComponent: () => import('./pages/admin/users/users.component').then(m => m.UsersComponent) },
      { path: 'admin/batches', loadComponent: () => import('./pages/admin/batches/batches.component').then(m => m.BatchesComponent) },
      { path: 'admin/config', loadComponent: () => import('./pages/admin/config/config.component').then(m => m.ConfigComponent) },
      { path: 'admin/audit', loadComponent: () => import('./pages/admin/audit/audit.component').then(m => m.AuditComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];