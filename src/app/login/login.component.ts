import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/authentication/auth.service';
import { SettingsService } from '../services/settings.service';
import { mensagemDeErro } from '../core/http/mensagem-erro';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);

  readonly form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    senha: ['', Validators.required]
  });

  logoUrl: string | null = null;
  nomeEmpresa = 'Controle de Produção';
  carregando = false;
  erro = '';

  ngOnInit(): void {
    this.carregarSettings();
  }

  carregarSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        if (settings.logoUrl) {
          this.logoUrl = settings.logoUrl;
        }
        if (settings.nomeEmpresa) {
          this.nomeEmpresa = settings.nomeEmpresa;
        }
      },
      // Antes do login não há empresa definida: o logo da empresa só aparece após entrar.
      error: () => { /* sem logo */ }
    });
  }

  entrar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.carregando = true;
    this.erro = '';

    const { login, senha } = this.form.getRawValue();
    this.auth.login(login, senha).subscribe({
      next: (res) => {
        this.carregando = false;
        // Usuário com acesso a mais de uma empresa escolhe o tenant antes de entrar
        void this.router.navigateByUrl(res.requerSelecaoTenant ? '/selecionar-tenant' : this.auth.rotaInicial());
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err?.status === 401 ? 'Login ou senha incorretos.' : mensagemDeErro(err, 'Não foi possível entrar.');
      }
    });
  }
}
