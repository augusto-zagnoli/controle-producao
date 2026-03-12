import { Routes } from '@angular/router';
import { adminGuard } from './auth/admin.guard';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './admin/admin.component';
import { AdminDetailComponent } from './admin-detail/admin-detail.component';
import { AdminFormComponent } from './admin-form/admin-form.component';
import { ProducaoComponent } from './producao/producao.component';
import { ProducaoDetailComponent } from './producao-detail/producao-detail.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin' },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'admin/nova', component: AdminFormComponent, canActivate: [adminGuard] },
  { path: 'admin/ordem/:id', component: AdminDetailComponent, canActivate: [adminGuard] },
  { path: 'admin/ordem/:id/editar', component: AdminFormComponent, canActivate: [adminGuard] },
  { path: 'producao', component: ProducaoComponent },
  { path: 'producao/ordem/:id', component: ProducaoDetailComponent },
  { path: '**', redirectTo: 'admin' }
];
