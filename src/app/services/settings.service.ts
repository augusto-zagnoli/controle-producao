import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Settings {
  id: number;
  logoUrl?: string;
  nomeEmpresa?: string;
  atualizadoEm: Date;
}

export interface UpdateSettingsDto {
  nomeEmpresa?: string;
  logoBase64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/settings`;
  
  private settingsSubject = new BehaviorSubject<Settings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.carregarSettings();
  }

  carregarSettings(): void {
    this.http.get<Settings>(`${this.apiUrl}/logo`).subscribe({
      next: (settings) => this.settingsSubject.next(settings),
      error: () => this.settingsSubject.next(null)
    });
  }

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`${this.apiUrl}/logo`);
  }

  atualizarSettings(dto: UpdateSettingsDto): Observable<Settings> {
    return this.http.put<Settings>(this.apiUrl, dto).pipe(
      tap(settings => this.settingsSubject.next(settings))
    );
  }
}
