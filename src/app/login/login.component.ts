import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    senha: ['', Validators.required]
  });

  carregando = false;
  erro = '';

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
