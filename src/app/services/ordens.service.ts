import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Documento,
  HistoricoItem,
  Imagem,
  OrdemServico,
  OrdemServicoCreate,
  OrdemServicoUpdate
} from '../models/ordem-servico.model';

@Injectable({ providedIn: 'root' })
export class OrdensService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/ordens-servico`;

  listar(busca?: string, status?: string): Observable<OrdemServico[]> {
    const params: Record<string, string> = {};
    if (busca) params['busca'] = busca;
    if (status) params['status'] = status;
    return this.http.get<OrdemServico[]>(this.base, { params });
  }

  obter(id: number): Observable<OrdemServico> {
    return this.http.get<OrdemServico>(`${this.base}/${id}`);
  }

  criar(dto: OrdemServicoCreate): Observable<OrdemServico> {
    return this.http.post<OrdemServico>(this.base, dto);
  }

  atualizar(id: number, dto: OrdemServicoUpdate): Observable<OrdemServico> {
    return this.http.put<OrdemServico>(`${this.base}/${id}`, dto);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Imagens
  adicionarImagem(id: number, arquivo: File): Observable<Imagem> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.post<Imagem>(`${this.base}/${id}/imagens`, form);
  }

  removerImagem(id: number, imagemId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/imagens/${imagemId}`);
  }

  // Documentos
  adicionarDocumento(id: number, arquivo: File): Observable<Documento> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.post<Documento>(`${this.base}/${id}/documentos`, form);
  }

  removerDocumento(id: number, docId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/documentos/${docId}`);
  }

  // Status
  alterarStatus(
    id: number,
    novoStatus: string,
    observacao: string | null,
    fotoOperador: File | null
  ): Observable<HistoricoItem> {
    const form = new FormData();
    form.append('novoStatus', novoStatus);
    if (observacao) form.append('observacao', observacao);
    if (fotoOperador) form.append('fotoOperador', fotoOperador);
    return this.http.post<HistoricoItem>(`${this.base}/${id}/alterar-status`, form);
  }

  // Histórico
  historico(id: number): Observable<HistoricoItem[]> {
    return this.http.get<HistoricoItem[]>(`${this.base}/${id}/historico`);
  }
}
