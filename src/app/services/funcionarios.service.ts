import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Funcionario, FuncionarioCreate } from '../models/funcionario.model';

@Injectable({ providedIn: 'root' })
export class FuncionariosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/funcionarios`;

  listar(ativo?: boolean): Observable<Funcionario[]> {
    const params: Record<string, string> = {};
    if (ativo !== undefined) params['ativo'] = String(ativo);
    return this.http.get<Funcionario[]>(this.base, { params });
  }

  obter(id: number): Observable<Funcionario> {
    return this.http.get<Funcionario>(`${this.base}/${id}`);
  }

  criar(dto: FuncionarioCreate): Observable<Funcionario> {
    return this.http.post<Funcionario>(this.base, dto);
  }

  atualizar(id: number, dto: FuncionarioCreate): Observable<Funcionario> {
    return this.http.put<Funcionario>(`${this.base}/${id}`, dto);
  }

  alternarAtivo(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/ativo`, {});
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
