import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HistoricoAlteracao, OrdemServico, OrdemServicoPayload, StatusOrdem } from './ordem-servico.model';

@Injectable({ providedIn: 'root' })
export class OrdensServicoService {
  private readonly storageKey = 'controle-producao:ordens';
  private readonly ordensSubject = new BehaviorSubject<OrdemServico[]>(this.carregar());

  readonly ordens$: Observable<OrdemServico[]> = this.ordensSubject.asObservable();

  constructor() {
    this.seed();
  }

  getById(id: string): Observable<OrdemServico | undefined> {
    return this.ordens$.pipe(map((ordens) => ordens.find((item) => item.id === id)));
  }

  criar(payload: OrdemServicoPayload): OrdemServico {
    const ordens = this.ordensSubject.value;
    const nova: OrdemServico = {
      ...payload,
      id: this.gerarId(),
      numero: this.gerarNumero(ordens),
      historico: [],
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };
    this.salvar([nova, ...ordens]);
    return nova;
  }

  atualizar(id: string, payload: OrdemServicoPayload): void {
    const atualizadas = this.ordensSubject.value.map((ordem) =>
      ordem.id === id
        ? {
            ...ordem,
            ...payload,
            dataAtualizacao: new Date().toISOString()
          }
        : ordem
    );
    this.salvar(atualizadas);
  }

  mudarStatus(id: string, statusNovo: StatusOrdem, observacao: string, fotoResponsavel: string): void {
    const atualizadas = this.ordensSubject.value.map((ordem) => {
      if (ordem.id !== id) {
        return ordem;
      }
      const historico: HistoricoAlteracao = {
        id: this.gerarId(),
        data: new Date().toISOString(),
        statusAnterior: ordem.status,
        statusNovo,
        observacao,
        fotoResponsavel
      };
      return {
        ...ordem,
        status: statusNovo,
        historico: [...ordem.historico, historico],
        dataAtualizacao: new Date().toISOString()
      };
    });
    this.salvar(atualizadas);
  }

  private seed(): void {
    if (this.ordensSubject.value.length > 0) {
      return;
    }
    const agora = new Date().toISOString();
    this.salvar([
      {
        id: 'seed-1',
        numero: 'OS-2026-0001',
        descricao: 'Eixo em aço 1045',
        cliente: 'Metalúrgica Alfa',
        prioridade: 'alta',
        status: 'pendente',
        material: 'Aço 1045',
        medidas: 'Ø50 x 280mm',
        observacoes: 'Tolerância 0,02mm na ponta.',
        imagens: [],
        pdfAutocad: '',
        pdfNomeArquivo: '',
        historico: [],
        dataCriacao: agora,
        dataAtualizacao: agora
      },
      {
        id: 'seed-2',
        numero: 'OS-2026-0002',
        descricao: 'Bucha de bronze',
        cliente: 'Usinagem Delta',
        prioridade: 'media',
        status: 'em_producao',
        material: 'Bronze SAE 65',
        medidas: 'Ø80 x Ø60 x 120mm',
        observacoes: 'Lote 8 peças.',
        imagens: [],
        pdfAutocad: '',
        pdfNomeArquivo: '',
        historico: [],
        dataCriacao: agora,
        dataAtualizacao: agora
      }
    ]);
  }

  private carregar(): OrdemServico[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    const value = localStorage.getItem(this.storageKey);
    if (!value) {
      return [];
    }
    return JSON.parse(value) as OrdemServico[];
  }

  private salvar(ordens: OrdemServico[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(ordens));
    }
    this.ordensSubject.next(ordens);
  }

  private gerarId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private gerarNumero(ordens: OrdemServico[]): string {
    const ano = new Date().getFullYear();
    const ultimo = ordens
      .map((item) => item.numero)
      .filter((numero) => numero.startsWith(`OS-${ano}-`))
      .map((numero) => Number(numero.split('-')[2]))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => b - a)[0];
    const proximo = (ultimo ?? 0) + 1;
    return `OS-${ano}-${String(proximo).padStart(4, '0')}`;
  }
}
