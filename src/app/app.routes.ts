import { Routes } from '@angular/router';
import { adminGuard } from './auth/admin.guard';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './admin/admin.component';
import { AdminDetailComponent } from './admin-detail/admin-detail.component';
import { AdminFormComponent } from './admin-form/admin-form.component';
import { AdminFuncionariosComponent } from './admin-funcionarios/admin-funcionarios.component';
import { AdminUsuariosComponent } from './admin-usuarios/admin-usuarios.component';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';
import { AdminLayoutComponent } from './shared/admin-layout/admin-layout.component';
import { ProducaoComponent } from './Public/producao/producao.component';
import { ProducaoDetailComponent } from './Public/producao-detail/producao-detail.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminComponent },
      { path: 'nova', component: AdminFormComponent },
      { path: 'ordem/:id', component: AdminDetailComponent },
      { path: 'ordem/:id/editar', component: AdminFormComponent },
      { path: 'funcionarios', component: AdminFuncionariosComponent },
      { path: 'usuarios', component: AdminUsuariosComponent },
      { path: 'configuracoes', component: AdminSettingsComponent }
    ]
  },
  { path: 'producao', component: ProducaoComponent },
  { path: 'producao/ordem/:id', component: ProducaoDetailComponent },
  { path: '**', redirectTo: 'login' }
];
