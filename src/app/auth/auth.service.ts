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
