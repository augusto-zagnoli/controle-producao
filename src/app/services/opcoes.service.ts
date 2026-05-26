import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OpcaoCampo } from '../models/ordem-servico.model';

export interface OpcaoCampoCreate {
  tipo: string;
  nome: string;
  ordem: number;
}

export interface OpcaoCampoUpdate {
  nome: string;
  ordem: number;
  ativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class OpcoesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/opcoes`;

  listar(tipo?: string): Observable<OpcaoCampo[]> {
    const params = tipo ? `?tipo=${tipo}` : '';
    return this.http.get<OpcaoCampo[]>(`${this.base}${params}`);
  }

  criar(dto: OpcaoCampoCreate): Observable<OpcaoCampo> {
    return this.http.post<OpcaoCampo>(this.base, dto);
  }

  atualizar(id: number, dto: OpcaoCampoUpdate): Observable<OpcaoCampo> {
    return this.http.put<OpcaoCampo>(`${this.base}/${id}`, dto);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
