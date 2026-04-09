import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, UsuarioCreate, UsuarioUpdate } from '../models/funcionario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base);
  }

  criar(dto: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, dto);
  }

  atualizar(id: number, dto: UsuarioUpdate): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, dto);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
