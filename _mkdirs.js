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
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface Usuario {
  usuario: string;
  papel: 'admin' | 'producao';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'controle-producao:auth';
  private readonly usuarioSubject = new BehaviorSubject<Usuario | null>(this.carregar());

  readonly usuario$: Observable<Usuario | null> = this.usuarioSubject.asObservable();

  constructor(private router: Router) {}

  get usuarioAtual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  get estaLogado(): boolean {
    return this.usuarioAtual !== null;
  }

  get ehAdmin(): boolean {
    return this.usuarioAtual?.papel === 'admin';
  }

  login(usuario: string, senha: string): boolean {
    const credenciais: Record<string, { senha: string; papel: 'admin' | 'producao' }> = {
      admin: { senha: 'admin123', papel: 'admin' },
      producao: { senha: 'producao123', papel: 'producao' }
    };

    const cred = credenciais[usuario];
    if (!cred || cred.senha !== senha) {
      return false;
    }

    const user: Usuario = { usuario, papel: cred.papel };
    this.salvar(user);
    this.usuarioSubject.next(user);
    return true;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }

  private carregar(): Usuario | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const value = localStorage.getItem(this.storageKey);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as Usuario;
  }

  private salvar(usuario: Usuario): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(usuario));
    }
  }
}
`,

  'auth/admin.guard.ts': `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaLogado && auth.ehAdmin) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
`,

  'login/login.component.ts': `import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  erro = '';

  entrar(): void {
    this.erro = '';
    const ok = this.auth.login(this.usuario, this.senha);
    if (ok) {
      const destino = this.auth.ehAdmin ? '/admin' : '/producao';
      this.router.navigate([destino]);
    } else {
      this.erro = 'Usu\u00e1rio ou senha inv\u00e1lidos.';
    }
  }
}
`,

  'login/login.component.html': `<section class="login-page">
  <div class="login-card">
    <h1>Controle de Produ\u00e7\u00e3o</h1>
    <h2>Login</h2>

    @if (erro) {
      <p class="erro">{{ erro }}</p>
    }

    <form (ngSubmit)="entrar()">
      <label>
        Usu\u00e1rio
        <input [(ngModel)]="usuario" name="usuario" required autocomplete="username" />
      </label>

      <label>
        Senha
        <input [(ngModel)]="senha" name="senha" type="password" required autocomplete="current-password" />
      </label>

      <button type="submit" class="btn primary">Entrar</button>
    </form>
  </div>
</section>
`,

  'login/login.component.scss': `.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 32px 24px;
  background: #fff;
  text-align: center;

  h1 {
    font-size: 1.25rem;
    margin: 0 0 4px;
  }

  h2 {
    font-size: 1rem;
    font-weight: 400;
    color: #666;
    margin: 0 0 24px;
  }
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  display: flex;
  flex-direction: column;
  text-align: left;
  font-size: 0.875rem;
  gap: 4px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.erro {
  color: #c62828;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.btn.primary {
  margin-top: 8px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: #1976d2;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background: #1565c0;
  }
}
`
};

// Write all files
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(base, relPath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', fullPath);
});

console.log('\nSetup complete! All 5 files created.');
