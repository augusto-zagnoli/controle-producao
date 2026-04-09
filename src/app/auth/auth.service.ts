import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { UsuarioLogado } from '../models/ordem-servico.model';

interface LoginResponse {
  token: string;
  usuario: UsuarioLogado;
}

const TOKEN_KEY = 'cp:token';
const USUARIO_KEY = 'cp:usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _usuario = new BehaviorSubject<UsuarioLogado | null>(this.carregarUsuario());
  readonly usuario$ = this._usuario.asObservable();

  get usuario(): UsuarioLogado | null {
    return this._usuario.value;
  }

  get logado(): boolean {
    return this._usuario.value !== null;
  }

  get isAdmin(): boolean {
    return this._usuario.value?.perfil === 'Administrador';
  }

  get isTecnico(): boolean {
    return this._usuario.value?.perfil === 'TecnicoCnc';
  }

  get token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  login(login: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { login, senha })
      .pipe(
        tap((res) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(TOKEN_KEY, res.token);
            localStorage.setItem(USUARIO_KEY, JSON.stringify(res.usuario));
          }
          this._usuario.next(res.usuario);
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
    }
    this._usuario.next(null);
    void this.router.navigate(['/login']);
  }

  private carregarUsuario(): UsuarioLogado | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USUARIO_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioLogado;
    } catch {
      return null;
    }
  }
}

