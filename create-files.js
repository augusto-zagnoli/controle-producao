const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src', 'app');

// Create directories
fs.mkdirSync(path.join(base, 'auth'), { recursive: true });
fs.mkdirSync(path.join(base, 'login'), { recursive: true });
console.log('Directories created.');

// --- File contents ---

const files = {
  'auth/auth.service.ts': `import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'controle-producao:auth';
  private readonly USUARIO = 'admin';
  private readonly SENHA = 'admin';

  private readonly logadoSubject = new BehaviorSubject<boolean>(this.verificarSessao());
  readonly logado$ = this.logadoSubject.asObservable();

  get logado(): boolean {
    return this.logadoSubject.value;
  }

  login(usuario: string, senha: string): boolean {
    if (usuario === this.USUARIO && senha === this.SENHA) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, 'true');
      }
      this.logadoSubject.next(true);
      return true;
    }
    return false;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.logadoSubject.next(false);
  }

  private verificarSessao(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }
}
`,

  'auth/admin.guard.ts': `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.logado) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
`,

  'login/login.component.ts': `import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  usuario = '';
  senha = '';
  erro = false;

  entrar(): void {
    this.erro = false;
    if (this.auth.login(this.usuario, this.senha)) {
      void this.router.navigate(['/admin']);
    } else {
      this.erro = true;
    }
  }
}
`,

  'login/login.component.html': `<section class="login-page">
  <div class="login-card">
    <h1>Acesso Administrativo</h1>
    <form (ngSubmit)="entrar()" class="form">
      <label>
        Usuário
        <input [(ngModel)]="usuario" name="usuario" autocomplete="username" />
      </label>
      <label>
        Senha
        <input [(ngModel)]="senha" name="senha" type="password" autocomplete="current-password" />
      </label>
      @if (erro) {
        <p class="erro">Usuário ou senha incorretos.</p>
      }
      <button type="submit" class="btn primary">Entrar</button>
    </form>
  </div>
</section>
`,

  'login/login.component.scss': `.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
}
.login-card {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
}
h1 {
  margin: 0 0 20px;
  font-size: 22px;
}
.form {
  display: grid;
  gap: 12px;
}
label {
  display: grid;
  gap: 6px;
  font-weight: 500;
}
input {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
}
.erro {
  color: #dc2626;
  margin: 0;
  font-size: 14px;
}
.btn.primary {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
}
`
};

// Write all files
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(base, relPath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', fullPath);
});

console.log('\nAll 5 files created successfully!');
