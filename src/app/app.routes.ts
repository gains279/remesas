import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'wallet', loadComponent: () => import('./pages/wallet/wallet.component').then(m => m.WalletComponent) },
  { path: 'pairs', loadComponent: () => import('./pages/pairs/pairs.component').then(m => m.PairsComponent) },
  { path: 'remittances', loadComponent: () => import('./pages/remittances/remittances.component').then(m => m.RemittancesComponent) },
  { path: 'profits', loadComponent: () => import('./pages/profits/profits.component').then(m => m.ProfitsComponent) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
];
