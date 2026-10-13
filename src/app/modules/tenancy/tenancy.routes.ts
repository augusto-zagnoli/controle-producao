import { Routes } from '@angular/router';

// Rotas do módulo de organização (carregado sob demanda dentro de /admin).
export default [
  { path: 'empresas', loadComponent: () => import('./empresas.component').then(m => m.EmpresasComponent) },
  { path: 'dispositivos', loadComponent: () => import('./dispositivos.component').then(m => m.DispositivosComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'empresas' }
] satisfies Routes;
