import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, TenantOpcao } from './auth.service';
import { mensagemDeErro } from '../http/mensagem-erro';

// Escolha da empresa (tenant) para usuários com acesso a mais de uma.
// Também usada para trocar de empresa durante a sessão.
@Component({
  selector: 'app-selecionar-tenant',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="acesso-page">
      <div class="acesso-card">
        <h2>Selecione a empresa</h2>
        <p class="sub">Olá{{ auth.usuario?.nome ? ', ' + auth.usuario?.nome : '' }}. Escolha com qual empresa deseja trabalhar.</p>

        @if (carregando) { <p class="info">Carregando...</p> }
        @if (erro) { <p class="erro">{{ erro }}</p> }

        <ul class="lista">
          @for (t of tenants; track t.id) {
            <li>
              <button type="button" (click)="escolher(t)" [disabled]="selecionando !== null">
                <strong>{{ t.nome }}</strong>
                <span>{{ t.papel === 'Administrador' ? 'Administrador' : 'Técnico CNC' }}</span>
              </button>
            </li>
          }
        </ul>

        <button type="button" class="link" (click)="sair()">Entrar com outro usuário</button>
      </div>
    </div>
  `,
  styles: [`
    .acesso-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 16px; }
    .acesso-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.08); padding: 32px; width: 100%; max-width: 440px; }
    h2 { margin: 0 0 8px; color: #1f2937; }
    .sub { color: #6b7280; margin: 0 0 20px; }
    .lista { list-style: none; padding: 0; margin: 0 0 16px; display: grid; gap: 10px; }
    .lista button { width: 100%; text-align: left; padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .lista button:hover:not([disabled]) { border-color: #2563eb; background: #eff6ff; }
    .lista span { color: #6b7280; font-size: 13px; }
    .erro { color: #b91c1c; background: #fef2f2; padding: 10px; border-radius: 6px; }
    .info { color: #6b7280; }
    .link { background: none; border: none; color: #2563eb; cursor: pointer; padding: 0; }
  `]
})
export class SelecionarTenantComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  tenants: TenantOpcao[] = [];
  carregando = true;
  selecionando: number | null = null;
  erro = '';

  ngOnInit(): void {
    if (!this.auth.tokenSelecao && !this.auth.logado) {
      void this.router.navigate(['/login']);
      return;
    }
    this.auth.listarTenants().subscribe({
      next: lista => {
        this.tenants = lista;
        this.carregando = false;
      },
      error: err => {
        this.carregando = false;
        this.erro = mensagemDeErro(err, 'Sessão expirada. Faça login novamente.');
      }
    });
  }

  escolher(t: TenantOpcao): void {
    this.selecionando = t.id;
    this.erro = '';
    this.auth.selecionarTenant(t.id).subscribe({
      next: () => void this.router.navigateByUrl(this.auth.rotaInicial()),
      error: err => {
        this.selecionando = null;
        this.erro = mensagemDeErro(err, 'Não foi possível acessar esta empresa.');
      }
    });
  }

  sair(): void {
    this.auth.logout();
  }
}
