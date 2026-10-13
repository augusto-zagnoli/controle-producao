import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { UsuarioLogado } from '../../models/ordem-servico.model';

export interface TenantResumo {
  id: number;
  nome: string;
}

export interface TenantOpcao {
  id: number;
  identificador: string;
  nome: string;
  papel: string;
}

export interface LoginResponse {
  token: string;
  expiraEm: string;
  usuario: UsuarioLogado;
  tenant: TenantResumo | null;
  requerSelecaoTenant: boolean;
  tenants: TenantOpcao[];
}

const TOKEN_KEY = 'cp:token';
const USUARIO_KEY = 'cp:usuario';
const TENANT_KEY = 'cp:tenant';
const SELECAO_KEY = 'cp:token-selecao';

// Sessão de usuário. O token só é guardado como "sessão" depois que há um tenant definido;
// com vários tenants, o login devolve um token de seleção (curto) usado apenas para escolher.
// O papel exibido vem da resposta do backend, que o confere a cada requisição.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly base = `${environment.apiUrl}/api/auth`;

  private readonly _usuario = new BehaviorSubject<UsuarioLogado | null>(this.ler<UsuarioLogado>(USUARIO_KEY));
  private readonly _tenant = new BehaviorSubject<TenantResumo | null>(this.ler<TenantResumo>(TENANT_KEY));
  readonly usuario$ = this._usuario.asObservable();
  readonly tenant$ = this._tenant.asObservable();

  get usuario(): UsuarioLogado | null {
    return this._usuario.value;
  }

  get tenant(): TenantResumo | null {
    return this._tenant.value;
  }

  get logado(): boolean {
    return this._usuario.value !== null && this._tenant.value !== null && this.token !== null;
  }

  get isAdmin(): boolean {
    return this.logado && this._usuario.value?.perfil === 'Administrador';
  }

  get isTecnico(): boolean {
    return this.logado && this._usuario.value?.perfil === 'TecnicoCnc';
  }

  get token(): string | null {
    return this.storage()?.getItem(TOKEN_KEY) ?? null;
  }

  get tokenSelecao(): string | null {
    return this.storage()?.getItem(SELECAO_KEY) ?? null;
  }

  login(login: string, senha: string): Observable<LoginResponse> {
    this.limparSessao();
    return this.http.post<LoginResponse>(`${this.base}/login`, { login, senha }).pipe(tap(res => this.aplicar(res)));
  }

  // Tenants disponíveis para o usuário (token de seleção ou sessão atual).
  listarTenants(): Observable<TenantOpcao[]> {
    return this.http.get<TenantOpcao[]>(`${this.base}/tenants`, { headers: this.cabecalhoSelecao() });
  }

  selecionarTenant(tenantId: number): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}/selecionar-tenant`, { tenantId }, { headers: this.cabecalhoSelecao() })
      .pipe(tap(res => this.aplicar(res)));
  }

  rotaInicial(): string {
    return this.isAdmin ? '/admin' : '/producao';
  }

  logout(): void {
    this.limparSessao();
    void this.router.navigate(['/login']);
  }

  private aplicar(res: LoginResponse): void {
    const s = this.storage();
    if (res.requerSelecaoTenant) {
      s?.setItem(SELECAO_KEY, res.token);
      s?.setItem(USUARIO_KEY, JSON.stringify(res.usuario));
      this._usuario.next(res.usuario);
      return;
    }
    s?.removeItem(SELECAO_KEY);
    s?.setItem(TOKEN_KEY, res.token);
    s?.setItem(USUARIO_KEY, JSON.stringify(res.usuario));
    s?.setItem(TENANT_KEY, JSON.stringify(res.tenant));
    this._usuario.next(res.usuario);
    this._tenant.next(res.tenant);
  }

  // O token de seleção é enviado explicitamente; a sessão atual (troca de tenant) também é aceita.
  private cabecalhoSelecao(): HttpHeaders {
    const token = this.tokenSelecao ?? this.token;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private limparSessao(): void {
    const s = this.storage();
    [TOKEN_KEY, USUARIO_KEY, TENANT_KEY, SELECAO_KEY].forEach(k => s?.removeItem(k));
    this._usuario.next(null);
    this._tenant.next(null);
  }

  private storage(): Storage | null {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined' ? localStorage : null;
  }

  private ler<T>(chave: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(chave);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
