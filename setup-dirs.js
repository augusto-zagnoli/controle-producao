const fs = require('fs');
const path = require('path');

// Usa o diretório do script como base absoluta
const projectRoot = path.resolve(__dirname);
const base = path.join(projectRoot, 'src', 'app');
console.log('Project root:', projectRoot);
console.log('App base:', base, '| exists:', fs.existsSync(base));

if (!fs.existsSync(base)) {
  console.error('ERRO: pasta src/app nao encontrada! Execute este script na raiz do projeto.');
  process.exit(1);
}

function write(relPath, content) {
  const parts = relPath.split('/');
  const full = path.join(base, ...parts);
  const dir = path.dirname(full);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(full)) {
    console.log('SKIP:', relPath);
    return;
  }
  fs.writeFileSync(full, content.replace(/^\n/, ''), 'utf8');
  console.log('CRIADO:', full);
}

write('auth/auth.service.ts', `
import { Injectable } from '@angular/core';
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
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }
}
`);

write('auth/admin.guard.ts', `
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.logado) return true;
  return router.createUrlTree(['/login']);
};
`);

write('login/login.component.ts', `
import { CommonModule } from '@angular/common';
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
`);

write('login/login.component.html', `
<section class="login-page">
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
`);

write('login/login.component.scss', `
.login-page {
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
`);

// Verificar os arquivos criados
console.log('\n--- Verificando arquivos ---');
['auth/auth.service.ts', 'auth/admin.guard.ts', 'login/login.component.ts', 'login/login.component.html', 'login/login.component.scss'].forEach(f => {
  const full = path.join(base, ...f.split('/'));
  console.log(fs.existsSync(full) ? 'OK' : 'FALTANDO', '-', f);
});

console.log('\nPronto!');


// ── auth/auth.service.ts ──────────────────────────────────────────────────────
write('auth/auth.service.ts', `
import { Injectable } from '@angular/core';
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
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }
}
`);

// ── auth/admin.guard.ts ───────────────────────────────────────────────────────
write('auth/admin.guard.ts', `
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.logado) return true;
  return router.createUrlTree(['/login']);
};
`);

// ── login/login.component.ts ──────────────────────────────────────────────────
write('login/login.component.ts', `
import { CommonModule } from '@angular/common';
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
`);

// ── login/login.component.html ────────────────────────────────────────────────
write('login/login.component.html', `
<section class="login-page">
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
`);

// ── login/login.component.scss ────────────────────────────────────────────────
write('login/login.component.scss', `
.login-page {
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
`);

console.log('\nTodos os arquivos criados!');


const dirs = [
  'models',
  'services',
  'shared',
  'shared/foto-captura-dialog',
  'shared/layout',
  'admin',
  'admin/dashboard',
  'admin/ordem-form',
  'admin/ordem-detalhe',
  'auth',
  'login',
  'producao',
  'producao/tablet-search',
  'producao/tablet-ordem-detalhe'
];

console.log('Base path:', base);
console.log('Base exists:', fs.existsSync(base));

dirs.forEach(d => {
  const full = path.join(base, ...d.split('/'));
  try {
    fs.mkdirSync(full, { recursive: true });
    console.log('OK:', full, '- exists:', fs.existsSync(full));
  } catch (e) {
    console.error('ERRO:', full, e.message);
  }
});

// Verify
console.log('\n--- Verificação ---');
dirs.forEach(d => {
  const full = path.join(base, ...d.split('/'));
  console.log(fs.existsSync(full) ? 'OK' : 'FALHOU', '-', d);
});

// Create a test file to confirm write access
const testFile = path.join(base, 'models', '_test.txt');
try {
  fs.writeFileSync(testFile, 'test');
  console.log('\nArquivo teste criado em:', testFile);
  fs.unlinkSync(testFile);
  console.log('Arquivo teste removido com sucesso');
} catch(e) {
  console.error('Erro ao escrever arquivo:', e.message);
}

console.log('\nScript finalizado!');
