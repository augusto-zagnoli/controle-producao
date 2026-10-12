import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApontamentoDetalhe,
  OpcoesFiltroRelatorio,
  Pagina,
  RelatorioDetalheFiltro,
  RelatorioProducao,
  RelatorioProducaoFiltro,
  UsoPastilhaDetalhe
} from '../models/relatorio-producao.model';

@Injectable({ providedIn: 'root' })
export class RelatoriosProducaoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/relatorios-producao`;

  opcoesFiltro(): Observable<OpcoesFiltroRelatorio> {
    return this.http.get<OpcoesFiltroRelatorio>(`${this.base}/opcoes-filtro`);
  }

  relatorio(filtro: RelatorioProducaoFiltro): Observable<RelatorioProducao> {
    return this.http.get<RelatorioProducao>(this.base, { params: paramsDe(filtro) });
  }

  apontamentos(filtro: RelatorioDetalheFiltro): Observable<Pagina<ApontamentoDetalhe>> {
    return this.http.get<Pagina<ApontamentoDetalhe>>(`${this.base}/apontamentos`, { params: paramsDe(filtro) });
  }

  usosPastilha(filtro: RelatorioDetalheFiltro): Observable<Pagina<UsoPastilhaDetalhe>> {
    return this.http.get<Pagina<UsoPastilhaDetalhe>>(`${this.base}/usos-pastilha`, { params: paramsDe(filtro) });
  }

  exportar(filtro: RelatorioProducaoFiltro): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/exportar`, {
      params: paramsDe(filtro),
      responseType: 'blob',
      observe: 'response'
    });
  }
}

export function paramsDe(filtro: object): HttpParams {
  let params = new HttpParams();
  for (const [chave, valor] of Object.entries(filtro)) {
    if (valor !== null && valor !== undefined && valor !== '') params = params.set(chave, String(valor));
  }
  return params;
}
