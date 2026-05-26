import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
      error: (err) => {
        console.error('Erro ao carregar settings:', err);
      }
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
        if (res.usuario.perfil === 'Administrador') {
          void this.router.navigate(['/admin']);
        } else {
          void this.router.navigate(['/producao']);
        }
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Login ou senha incorretos.';
      }
    });
  }
}
