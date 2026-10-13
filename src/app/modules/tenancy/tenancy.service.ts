import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Filial {
  id: number;
  empresaId: number;
  nome: string;
  codigo: string | null;
  cnpj: string | null;
  cidade: string | null;
  uf: string | null;
  ativa: boolean;
}

export interface Empresa {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  cnpjFormatado: string;
  inscricaoEstadual: string | null;
  ativa: boolean;
  criadoEm: string;
  filiais: Filial[];
}

export interface EmpresaRequest {
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  inscricaoEstadual: string | null;
  ativa: boolean;
}

export interface FilialRequest {
  empresaId: number;
  nome: string;
  codigo: string | null;
  cnpj: string | null;
  cidade: string | null;
  uf: string | null;
  ativa: boolean;
}

export type TipoDispositivo = 'Tablet' | 'Painel';

export interface Dispositivo {
  id: number;
  nome: string;
  tipo: TipoDispositivo;
  chavePrefixo: string;
  ativo: boolean;
  criadoEm: string;
  ultimoAcessoEm: string | null;
  revogadoEm: string | null;
}

export interface DispositivoCriado {
  dispositivo: Dispositivo;
  chave: string;
}

@Injectable({ providedIn: 'root' })
export class TenancyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/tenancy`;

  listarEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.base}/empresas`);
  }

  criarEmpresa(req: EmpresaRequest): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.base}/empresas`, req);
  }

  atualizarEmpresa(id: number, req: EmpresaRequest): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.base}/empresas/${id}`, req);
  }

  excluirEmpresa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/empresas/${id}`);
  }

  criarFilial(req: FilialRequest): Observable<Filial> {
    return this.http.post<Filial>(`${this.base}/empresas/filiais`, req);
  }

  atualizarFilial(id: number, req: FilialRequest): Observable<Filial> {
    return this.http.put<Filial>(`${this.base}/empresas/filiais/${id}`, req);
  }

  excluirFilial(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/empresas/filiais/${id}`);
  }

  listarDispositivos(): Observable<Dispositivo[]> {
    return this.http.get<Dispositivo[]>(`${this.base}/dispositivos`);
  }

  criarDispositivo(nome: string, tipo: TipoDispositivo): Observable<DispositivoCriado> {
    return this.http.post<DispositivoCriado>(`${this.base}/dispositivos`, { nome, tipo });
  }

  revogarDispositivo(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/dispositivos/${id}/revogar`, {});
  }
}
