import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Apontamento, Operacao, OrdemProducao, StatusOP } from './ordem-servico.model';

@Injectable({ providedIn: 'root' })
export class OrdensServicoService {
  private readonly ORDENS_KEY = 'controle-producao:ordens';
  private readonly APONTAMENTOS_KEY = 'controle-producao:apontamentos';

  private readonly ordensSubject = new BehaviorSubject<OrdemProducao[]>(this.carregar());

  readonly ordens$: Observable<OrdemProducao[]> = this.ordensSubject.asObservable();

  constructor() {
    if (this.ordensSubject.value.length === 0) {
      this.salvarStorage(this.seedData());
    }
  }

  getById(id: string): Observable<OrdemProducao | undefined> {
    return this.ordens$.pipe(map((ordens) => ordens.find((o) => o.id === id)));
  }

  getOrdens(): OrdemProducao[] {
    return this.ordensSubject.value;
  }

  getProximoNumeroOP(): number {
    const ordens = this.ordensSubject.value;
    if (ordens.length === 0) return 1;
    return Math.max(...ordens.map((o) => o.numeroOP)) + 1;
  }

  criar(payload: Omit<OrdemProducao, 'id' | 'numeroOP' | 'criadoEm' | 'atualizadoEm'>): OrdemProducao {
    const agora = new Date().toISOString();
    const nova: OrdemProducao = {
      ...payload,
      id: this.gerarId(),
      numeroOP: this.getProximoNumeroOP(),
      criadoEm: agora,
      atualizadoEm: agora
    };
    const ordens = [nova, ...this.ordensSubject.value];
    this.salvarStorage(ordens);
    return nova;
  }

  atualizar(id: string, payload: Partial<Omit<OrdemProducao, 'id' | 'numeroOP' | 'criadoEm'>>): void {
    const atualizadas = this.ordensSubject.value.map((o) =>
      o.id === id ? { ...o, ...payload, atualizadoEm: new Date().toISOString() } : o
    );
    this.salvarStorage(atualizadas);
  }

  atualizarOperacao(ordemId: string, operacaoAtualizada: Operacao): void {
    const atualizadas = this.ordensSubject.value.map((o) => {
      if (o.id !== ordemId) return o;
      const operacoes = o.operacoes.map((op) =>
        op.id === operacaoAtualizada.id ? operacaoAtualizada : op
      );
      const todasConcluidas = operacoes.every((op) => op.status === 'concluida');
      const algumAndamento = operacoes.some((op) => op.status === 'em_andamento');
      let status: StatusOP = o.status;
      if (todasConcluidas) status = 'concluida';
      else if (algumAndamento || operacoes.some((op) => op.status === 'concluida')) status = 'em_producao';
      return { ...o, operacoes, status, atualizadoEm: new Date().toISOString() };
    });
    this.salvarStorage(atualizadas);
  }

  excluir(id: string): void {
    this.salvarStorage(this.ordensSubject.value.filter((o) => o.id !== id));
  }

  // ── Apontamentos ─────────────────────────────────────────────────────────────

  getApontamentos(ordemId?: string): Apontamento[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.APONTAMENTOS_KEY);
    const todos: Apontamento[] = raw ? (JSON.parse(raw) as Apontamento[]) : [];
    return ordemId ? todos.filter((a) => a.ordemId === ordemId) : todos;
  }

  registrarApontamento(apontamento: Omit<Apontamento, 'id' | 'createdAt'>): Apontamento {
    const novo: Apontamento = {
      ...apontamento,
      id: this.gerarId(),
      createdAt: new Date().toISOString()
    };
    const todos = this.getApontamentos();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.APONTAMENTOS_KEY, JSON.stringify([novo, ...todos]));
    }
    return novo;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private carregar(): OrdemProducao[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.ORDENS_KEY);
    return raw ? (JSON.parse(raw) as OrdemProducao[]) : [];
  }

  private salvarStorage(ordens: OrdemProducao[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.ORDENS_KEY, JSON.stringify(ordens));
    }
    this.ordensSubject.next(ordens);
  }

  private gerarId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private seedData(): OrdemProducao[] {
    const agora = new Date().toISOString();
    return [
      {
        id: 'seed-001',
        numeroOP: 256,
        nomePeca: 'Terminal 1W32FH32',
        material: 'SAE 1020',
        quantidade: 6,
        prazoEntrega: '2025-06-06',
        cliente: 'VEMEX',
        observacoes: '',
        imagens: [],
        operacoes: [
          {
            id: 'seed-001-op1',
            numero: 1,
            tipoOperacao: '1ª OPERAÇÃO',
            status: 'concluida',
            medicoes: [
              { label: 'Ø externo', predefinido: '32,00mm', encontrado: '32,01mm' },
              { label: 'Comprimento', predefinido: '80,00mm', encontrado: '80,00mm' },
              { label: 'Rosca', predefinido: 'M20', encontrado: 'M20' },
              { label: 'Chanfro', predefinido: '1x45°', encontrado: '1x45°' }
            ],
            pecasRefugadas: 0,
            maquina: 'CNC-01',
            operador: 'ELIAS',
            programador: 'PEDRO',
            quantidade: 6,
            dataHoraInicial: '2025-06-02T11:55:00',
            dataHoraFinal: '2025-06-02T16:26:00'
          },
          {
            id: 'seed-001-op2',
            numero: 2,
            tipoOperacao: 'COMPLETO',
            status: 'pendente',
            medicoes: [
              { label: 'Ø externo', predefinido: '32,00mm', encontrado: '' },
              { label: 'Comprimento', predefinido: '80,00mm', encontrado: '' },
              { label: 'Rosca', predefinido: 'M20', encontrado: '' },
              { label: 'Chanfro', predefinido: '1x45°', encontrado: '' }
            ],
            pecasRefugadas: 0
          }
        ],
        status: 'em_producao',
        criadoEm: agora,
        atualizadoEm: agora
      },
      {
        id: 'seed-002',
        numeroOP: 300,
        nomePeca: 'Pestana 2"',
        material: 'SAE 1045',
        quantidade: 22,
        prazoEntrega: '2025-06-30',
        cliente: 'VEMEX',
        observacoes: '',
        imagens: [],
        operacoes: [
          {
            id: 'seed-002-op1',
            numero: 1,
            tipoOperacao: 'COMPLETO',
            status: 'pendente',
            medicoes: [
              { label: 'Ø flange', predefinido: '60,00mm', encontrado: '' },
              { label: 'Espessura', predefinido: '12,00mm', encontrado: '' },
              { label: 'Ø furo', predefinido: '50,70mm', encontrado: '' },
              { label: 'Profundidade', predefinido: '8,00mm', encontrado: '' }
            ],
            pecasRefugadas: 0
          }
        ],
        status: 'pendente',
        criadoEm: agora,
        atualizadoEm: agora
      }
    ];
  }
}

