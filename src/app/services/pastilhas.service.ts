import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Pastilha,
  PastilhaCreate,
  PastilhaUpdate,
  PastilhaDashboard,
  RegistrarUsoPastilha,
  UsoPastilha
} from '../models/pastilha.model';

@Injectable({ providedIn: 'root' })
export class PastilhasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/pastilhas`;

  listar(ativa?: boolean): Observable<Pastilha[]> {
    const params: Record<string, string> = {};
    if (ativa !== undefined) params['ativa'] = String(ativa);
    return this.http.get<Pastilha[]>(this.base, { params });
  }

  listarDisponiveis(): Observable<Pastilha[]> {
    return this.http.get<Pastilha[]>(`${this.base}/disponiveis`);
  }

  dashboard(): Observable<PastilhaDashboard> {
    return this.http.get<PastilhaDashboard>(`${this.base}/dashboard`);
  }

  obter(id: number): Observable<Pastilha> {
    return this.http.get<Pastilha>(`${this.base}/${id}`);
  }

  criar(dto: PastilhaCreate): Observable<Pastilha> {
    return this.http.post<Pastilha>(this.base, dto);
  }

  atualizar(id: number, dto: PastilhaUpdate): Observable<Pastilha> {
    return this.http.put<Pastilha>(`${this.base}/${id}`, dto);
  }

  registrarUso(dto: RegistrarUsoPastilha): Observable<UsoPastilha> {
    return this.http.post<UsoPastilha>(`${this.base}/registrar-uso`, dto);
  }

  listarUsosPorOrdem(ordemServicoId: number): Observable<UsoPastilha[]> {
    return this.http.get<UsoPastilha[]>(`${this.base}/usos/ordem/${ordemServicoId}`);
  }
}
