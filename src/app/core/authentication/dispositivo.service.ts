import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, map, of, shareReplay, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DispositivoSessao {
  token: string;
  expiraEm: string;
  dispositivoId: number;
  nome: string;
  papel: 'DispositivoTablet' | 'DispositivoPainel';
  tenant: { id: number; nome: string };
}

const CHAVE_KEY = 'zerp:dispositivo:chave';
const SESSAO_KEY = 'zerp:dispositivo:sessao';

// Sessão de dispositivo (tablet de chão de fábrica ou painel de TV). A chave fica guardada
// no aparelho e é trocada por um token de curta duração sempre que necessário. Revogar o
// dispositivo no admin invalida a chave e o token no backend.
@Injectable({ providedIn: 'root' })
export class DispositivoService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private renovacao$: Observable<DispositivoSessao | null> | null = null;

  get sessao(): DispositivoSessao | null {
    const raw = this.storage()?.getItem(SESSAO_KEY);
    if (!raw) return null;
    try {
      const sessao = JSON.parse(raw) as DispositivoSessao;
      // Margem de 1 minuto antes da expiração
      return new Date(sessao.expiraEm).getTime() - 60_000 > Date.now() ? sessao : null;
    } catch {
      return null;
    }
  }

  get token(): string | null {
    return this.sessao?.token ?? null;
  }

  get possuiChave(): boolean {
    return !!this.storage()?.getItem(CHAVE_KEY);
  }

  get ehTablet(): boolean {
    return this.sessao?.papel === 'DispositivoTablet';
  }

  ativar(chave: string): Observable<DispositivoSessao> {
    return this.trocarChave(chave.trim()).pipe(tap(() => this.storage()?.setItem(CHAVE_KEY, chave.trim())));
  }

  // Garante uma sessão válida usando a chave guardada (null se não houver chave ou se ela foi revogada).
  garantirSessao(forcarRenovacao = false): Observable<DispositivoSessao | null> {
    const atual = this.sessao;
    if (atual && !forcarRenovacao) return of(atual);
    const chave = this.storage()?.getItem(CHAVE_KEY);
    if (!chave) return of(null);

    this.renovacao$ ??= this.trocarChave(chave).pipe(
      catchError(() => {
        this.desativar();
        return of(null);
      }),
      finalize(() => (this.renovacao$ = null)),
      shareReplay(1)
    );
    return this.renovacao$;
  }

  desativar(): void {
    this.storage()?.removeItem(CHAVE_KEY);
    this.storage()?.removeItem(SESSAO_KEY);
  }

  private trocarChave(chave: string): Observable<DispositivoSessao> {
    return this.http.post<DispositivoSessao>(`${environment.apiUrl}/api/auth/dispositivo`, { chave }).pipe(
      tap(sessao => this.storage()?.setItem(SESSAO_KEY, JSON.stringify(sessao))),
      map(sessao => sessao)
    );
  }

  private storage(): Storage | null {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined' ? localStorage : null;
  }
}
