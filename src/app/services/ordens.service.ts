import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DashboardAdm,
  Documento,
  HistoricoItem,
  HistoricoMensalItem,
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
    fotoOperador: File | null,
    funcionarioId: number | null
  ): Observable<HistoricoItem> {
    const form = new FormData();
    form.append('novoStatus', novoStatus);
    if (observacao) form.append('observacao', observacao);
    if (fotoOperador) form.append('fotoOperador', fotoOperador);
    if (funcionarioId !== null) form.append('funcionarioId', String(funcionarioId));
    return this.http.post<HistoricoItem>(`${this.base}/${id}/alterar-status`, form);
  }

  // Função / Setor (chão de fábrica)
  alterarFuncaoSetor(
    id: number,
    funcao: string,
    setor: string,
    funcionarioId: number | null,
    quantidadeRecebida?: number,
    equipamento?: string | null,
    quantidadePerdida?: number
  ): Observable<OrdemServico> {
    return this.http.post<OrdemServico>(`${this.base}/${id}/funcao-setor`, {
      funcao,
      setor,
      equipamento: equipamento ?? null,
      funcionarioId,
      quantidadeRecebida: quantidadeRecebida ?? 0,
      quantidadePerdida: quantidadePerdida ?? 0
    });
  }

  salvarTablet(
    id: number,
    setor: string,
    equipamento: string | null,
    operacaoAtual: string | null,
    funcionarioResponsavelId: number,
    quantidadeRecebida: number,
    quantidadePerdida: number,
    funcionarioAcaoId: number,
    novoStatus: string,
    observacao: string | null,
    fotoOperador: File | null,
    funcionarioConferenteId: number | null
  ): Observable<void> {
    const form = new FormData();
    form.append('setor', setor);
    if (equipamento) form.append('equipamento', equipamento);
    if (operacaoAtual) form.append('operacaoAtual', operacaoAtual);
    form.append('funcionarioResponsavelId', String(funcionarioResponsavelId));
    form.append('quantidadeRecebida', String(quantidadeRecebida));
    form.append('quantidadePerdida', String(quantidadePerdida));
    form.append('funcionarioAcaoId', String(funcionarioAcaoId));
    form.append('novoStatus', novoStatus);
    if (observacao) form.append('observacao', observacao);
    if (fotoOperador) form.append('fotoOperador', fotoOperador);
    if (funcionarioConferenteId && funcionarioConferenteId > 0) form.append('funcionarioConferenteId', String(funcionarioConferenteId));
    return this.http.post<void>(`${this.base}/${id}/salvar-tablet`, form);
  }

  // Dashboard Administrativo
  dashboardAdm(dataInicio?: string, dataFim?: string): Observable<DashboardAdm> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim)    params = params.set('dataFim', dataFim);
    return this.http.get<DashboardAdm>(`${this.base}/dashboard-adm`, { params });
  }

  dashboardHistoricoMensal(meses = 6): Observable<HistoricoMensalItem[]> {
    const params = new HttpParams().set('meses', String(meses));
    return this.http.get<HistoricoMensalItem[]>(`${this.base}/dashboard-adm/historico-mensal`, { params });
  }

  // Histórico
  historico(id: number): Observable<HistoricoItem[]> {
    return this.http.get<HistoricoItem[]>(`${this.base}/${id}/historico`);
  }
}
