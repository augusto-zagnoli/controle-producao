import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Chart, ChartConfiguration,
  BarController, BarElement,
  CategoryScale, LinearScale,
  Tooltip, Legend
} from 'chart.js';
import {
  ApontamentoDetalhe,
  OpcoesFiltroRelatorio,
  Pagina,
  ProducaoPorMaquina,
  ProducaoPorOperador,
  ProducaoPorOrdem,
  RelatorioProducao,
  RelatorioProducaoFiltro,
  RendimentoPastilha,
  UsoPastilhaDetalhe
} from '../models/relatorio-producao.model';
import { RelatoriosProducaoService } from '../services/relatorios-producao.service';
import { ToastService } from '../shared/toast/toast.service';
import { ColunaTabela, TabelaAnaliticaComponent, formatarValor } from '../shared/tabela-analitica/tabela-analitica.component';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Slots fixos da paleta categórica do projeto (validados: azul ↔ magenta)
const COR_BOAS = '#2a78d6';
const COR_REFUGO = '#e87ba4';
const COR_UNICA = '#2a78d6';
const MAX_RANKING = 10;

type DetalheAtivo = 'apontamentos' | 'pastilhas';

@Component({
  selector: 'app-admin-relatorios-producao',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, ReactiveFormsModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    TabelaAnaliticaComponent,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
  templateUrl: './admin-relatorios-producao.component.html',
  styleUrl: './admin-relatorios-producao.component.scss',
})
export class AdminRelatoriosProducaoComponent implements OnInit, OnDestroy {
  private readonly service = inject(RelatoriosProducaoService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroy$ = new Subject<void>();
  private readonly cancelarDetalhe$ = new Subject<void>();

  @ViewChild('chartProducaoEl') chartProducaoEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPastilhasDiaEl') chartPastilhasDiaEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartRendimentoEl') chartRendimentoEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartOperadoresEl') chartOperadoresEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPerdasOperadorEl') chartPerdasOperadorEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPerdasMaquinaEl') chartPerdasMaquinaEl?: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  opcoes: OpcoesFiltroRelatorio = { maquinas: [], operadores: [], produtos: [], pastilhas: [] };
  dados: RelatorioProducao | null = null;
  carregando = false;
  erro = '';
  exportando = false;

  private readonly hoje = new Date();

  readonly form = this.fb.group({
    inicio: [new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1) as Date | null],
    fim: [this.hoje as Date | null],
    maquina: [''],
    funcionarioId: [0],
    ordemCodigo: [null as number | null],
    produto: [''],
    pastilhaId: [0],
  });

  // ── Detalhes (paginação/ordenação no servidor) ──────────────────────────────
  detalheAtivo: DetalheAtivo = 'apontamentos';
  detalheApontamentos: Pagina<ApontamentoDetalhe> | null = null;
  detalhePastilhas: Pagina<UsoPastilhaDetalhe> | null = null;
  carregandoDetalhe = false;
  erroDetalhe = '';
  paginaDetalhe = 0;
  tamanhoPaginaDetalhe = 25;
  ordenacaoDetalhe: Sort = { active: 'dataHora', direction: 'desc' };

  readonly colunasDetalheApontamentos = ['dataHora', 'ordemCodigo', 'produto', 'maquina', 'operador', 'recebidaAcumulada', 'perdidaAcumulada', 'deltaBoas', 'deltaRefugadas', 'tipo'];
  readonly colunasDetalhePastilhas = ['dataHora', 'pastilhaCodigo', 'ordemCodigo', 'produto', 'maquina', 'operador', 'quantidade', 'usoAcumuladoAposRegistro'];

  // ── Tabelas analíticas (agregadas) ──────────────────────────────────────────
  readonly colunasMaquina: ColunaTabela<ProducaoPorMaquina>[] = [
    { chave: 'maquina', titulo: 'Máquina', valor: m => m.maquina },
    { chave: 'pecasBoas', titulo: 'Boas', tipo: 'numero', valor: m => m.pecasBoas },
    { chave: 'pecasRefugadas', titulo: 'Refugadas', tipo: 'numero', valor: m => m.pecasRefugadas },
    { chave: 'pecasProduzidas', titulo: 'Produzidas', tipo: 'numero', valor: m => m.pecasProduzidas },
    { chave: 'taxaRefugo', titulo: 'Refugo', tipo: 'percentual', valor: m => m.taxaRefugo },
    { chave: 'pecasComPastilha', titulo: 'Peças c/ pastilha', tipo: 'numero', valor: m => m.pecasComPastilha },
    { chave: 'pastilhasUtilizadas', titulo: 'Pastilhas', tipo: 'numero', valor: m => m.pastilhasUtilizadas },
    { chave: 'rendimento', titulo: 'Peças/pastilha', tipo: 'decimal', valor: m => m.rendimentoMedioPastilha },
  ];

  readonly colunasOperador: ColunaTabela<ProducaoPorOperador>[] = [
    { chave: 'operador', titulo: 'Operador', valor: o => o.operador },
    { chave: 'pecasBoas', titulo: 'Boas', tipo: 'numero', valor: o => o.pecasBoas },
    { chave: 'pecasRefugadas', titulo: 'Refugadas', tipo: 'numero', valor: o => o.pecasRefugadas },
    { chave: 'pecasProduzidas', titulo: 'Produzidas', tipo: 'numero', valor: o => o.pecasProduzidas },
    { chave: 'taxaRefugo', titulo: 'Refugo', tipo: 'percentual', valor: o => o.taxaRefugo },
    { chave: 'apontamentos', titulo: 'Apontamentos', tipo: 'numero', valor: o => o.apontamentos },
    { chave: 'maquinas', titulo: 'Máquinas', valor: o => o.maquinas.join(', ') },
  ];

  readonly colunasPastilha: ColunaTabela<RendimentoPastilha>[] = [
    { chave: 'codigo', titulo: 'Pastilha', valor: p => p.codigo },
    { chave: 'tipo', titulo: 'Tipo / modelo', valor: p => [p.tipo, p.modelo].filter(Boolean).join(' / ') || null },
    { chave: 'pecasNoPeriodo', titulo: 'Peças no período', tipo: 'numero', valor: p => p.pecasNoPeriodo },
    { chave: 'usoAcumuladoTotal', titulo: 'Uso acumulado', tipo: 'numero', valor: p => p.usoAcumuladoTotal },
    { chave: 'vidaUtilQuantidade', titulo: 'Vida útil', tipo: 'numero', valor: p => p.vidaUtilQuantidade },
    { chave: 'percentualVidaUtil', titulo: '% vida útil', tipo: 'percentual', valor: p => p.percentualVidaUtil },
    { chave: 'atingiuVidaUtilEm', titulo: 'Atingiu vida útil em', tipo: 'data', valor: p => p.atingiuVidaUtilEm },
    { chave: 'maquinas', titulo: 'Máquinas', valor: p => p.maquinas.join(', ') },
  ];

  readonly colunasOrdem: ColunaTabela<ProducaoPorOrdem>[] = [
    { chave: 'codigo', titulo: 'OS', tipo: 'numero', valor: o => o.codigo },
    { chave: 'produto', titulo: 'Produto', valor: o => o.produto },
    { chave: 'pecasBoas', titulo: 'Boas', tipo: 'numero', valor: o => o.pecasBoas },
    { chave: 'pecasRefugadas', titulo: 'Refugadas', tipo: 'numero', valor: o => o.pecasRefugadas },
    { chave: 'pecasProduzidas', titulo: 'Produzidas', tipo: 'numero', valor: o => o.pecasProduzidas },
    { chave: 'taxaRefugo', titulo: 'Refugo', tipo: 'percentual', valor: o => o.taxaRefugo },
  ];

  readonly formatar = formatarValor;

  get semDados(): boolean {
    return !!this.dados && this.dados.resumo.pecasProduzidas === 0
      && this.dados.resumo.ajusteBoas === 0 && this.dados.resumo.ajusteRefugadas === 0
      && this.dados.pastilhas.pastilhasUtilizadas === 0;
  }

  get temAjustes(): boolean {
    return !!this.dados && (this.dados.resumo.ajusteBoas !== 0 || this.dados.resumo.ajusteRefugadas !== 0);
  }

  get indisponivelProgramador() {
    return this.dados?.indisponiveis.find(i => i.indicador.toLowerCase().includes('programador')) ?? null;
  }

  get outrosIndisponiveis() {
    return this.dados?.indisponiveis.filter(i => i !== this.indisponivelProgramador) ?? [];
  }

  ngOnInit(): void {
    this.service.opcoesFiltro().pipe(takeUntil(this.destroy$)).subscribe({
      next: o => this.opcoes = o,
      error: () => this.toast.error('Não foi possível carregar as opções de filtro.')
    });
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelarDetalhe$.next();
    this.cancelarDetalhe$.complete();
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────

  selecionarHoje(): void {
    const d = new Date();
    this.form.patchValue({ inicio: d, fim: d });
    this.aplicarFiltros();
  }

  selecionarSemana(): void {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - (hoje.getDay() || 7) + 1);
    this.form.patchValue({ inicio, fim: hoje });
    this.aplicarFiltros();
  }

  selecionarMes(): void {
    const hoje = new Date();
    this.form.patchValue({ inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1), fim: hoje });
    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.form.patchValue({ maquina: '', funcionarioId: 0, ordemCodigo: null, produto: '', pastilhaId: 0 });
    this.aplicarFiltros();
  }

  private filtroAtual(): RelatorioProducaoFiltro | null {
    const v = this.form.getRawValue();
    if (!v.inicio || !v.fim) return null;
    return {
      dataInicio: this.toISO(v.inicio),
      dataFim: this.toISO(v.fim),
      maquina: v.maquina || null,
      funcionarioId: Number(v.funcionarioId) > 0 ? Number(v.funcionarioId) : null,
      ordemCodigo: Number(v.ordemCodigo) > 0 ? Number(v.ordemCodigo) : null,
      produto: v.produto || null,
      pastilhaId: Number(v.pastilhaId) > 0 ? Number(v.pastilhaId) : null,
    };
  }

  aplicarFiltros(): void {
    const filtro = this.filtroAtual();
    if (!filtro) { this.erro = 'Informe o período.'; return; }
    if (filtro.dataFim < filtro.dataInicio) { this.erro = 'A data final deve ser maior ou igual à data inicial.'; return; }

    this.carregando = true;
    this.erro = '';
    this.destruirCharts();
    this.service.relatorio(filtro).pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.dados = d;
        this.carregando = false;
        this.cdr.detectChanges(); // garante os <canvas> no DOM antes de desenhar
        this.renderCharts();
        this.paginaDetalhe = 0;
        this.carregarDetalhe();
      },
      error: err => {
        this.dados = null;
        this.carregando = false;
        this.erro = err?.error?.erro ?? 'Erro ao carregar o relatório.';
      }
    });
  }

  exportar(): void {
    const filtro = this.filtroAtual();
    if (!filtro || this.exportando) return;
    this.exportando = true;
    this.service.exportar(filtro).pipe(takeUntil(this.destroy$)).subscribe({
      next: resp => {
        this.exportando = false;
        if (!resp.body || !this.navegador) return;
        const nome = /filename="?([^";]+)"?/.exec(resp.headers.get('content-disposition') ?? '')?.[1]
          ?? `relatorio-producao_${filtro.dataInicio}_${filtro.dataFim}.xlsx`;
        const url = URL.createObjectURL(resp.body);
        const a = document.createElement('a');
        a.href = url;
        a.download = nome;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.exportando = false;
        this.toast.error('Erro ao exportar o relatório.');
      }
    });
  }

  // ── Detalhes ────────────────────────────────────────────────────────────────

  selecionarDetalhe(tipo: DetalheAtivo): void {
    if (this.detalheAtivo === tipo) return;
    this.detalheAtivo = tipo;
    this.paginaDetalhe = 0;
    this.ordenacaoDetalhe = { active: 'dataHora', direction: 'desc' };
    this.carregarDetalhe();
  }

  ordenarDetalhe(sort: Sort): void {
    this.ordenacaoDetalhe = sort;
    this.paginaDetalhe = 0;
    this.carregarDetalhe();
  }

  paginarDetalhe(e: PageEvent): void {
    this.paginaDetalhe = e.pageIndex;
    this.tamanhoPaginaDetalhe = e.pageSize;
    this.carregarDetalhe();
  }

  private carregarDetalhe(): void {
    const filtro = this.filtroAtual();
    if (!filtro) return;
    this.cancelarDetalhe$.next();
    this.carregandoDetalhe = true;
    this.erroDetalhe = '';

    const params = {
      ...filtro,
      pagina: this.paginaDetalhe + 1,
      tamanhoPagina: this.tamanhoPaginaDetalhe,
      ordenarPor: this.ordenacaoDetalhe.direction ? this.ordenacaoDetalhe.active : 'dataHora',
      direcao: this.ordenacaoDetalhe.direction || 'desc',
    };
    const erro = () => { this.carregandoDetalhe = false; this.erroDetalhe = 'Erro ao carregar os registros detalhados.'; };

    if (this.detalheAtivo === 'apontamentos') {
      this.service.apontamentos(params).pipe(takeUntil(this.cancelarDetalhe$)).subscribe({
        next: p => { this.detalheApontamentos = p; this.carregandoDetalhe = false; },
        error: erro
      });
    } else {
      this.service.usosPastilha(params).pipe(takeUntil(this.cancelarDetalhe$)).subscribe({
        next: p => { this.detalhePastilhas = p; this.carregandoDetalhe = false; },
        error: erro
      });
    }
  }

  // ── Gráficos ────────────────────────────────────────────────────────────────

  private destruirCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private renderCharts(): void {
    if (!this.navegador || !this.dados || this.semDados) return;
    const d = this.dados;
    const dias = d.serieDiaria.map(s => this.rotuloDia(s.data));

    // Produção e pastilhas em gráficos separados com o mesmo eixo X:
    // grandezas diferentes nunca dividem um eixo Y duplo.
    this.criar(this.chartProducaoEl, {
      type: 'bar',
      data: {
        labels: dias,
        datasets: [
          this.serie('Peças boas', d.serieDiaria.map(s => s.pecasBoas), COR_BOAS),
          this.serie('Peças refugadas', d.serieDiaria.map(s => s.pecasRefugadas), COR_REFUGO),
        ]
      },
      options: this.opcoesBarras('peças', true, false)
    });

    this.criar(this.chartPastilhasDiaEl, {
      type: 'bar',
      data: {
        labels: dias,
        datasets: [this.serie('Pastilhas utilizadas', d.serieDiaria.map(s => s.pastilhasUtilizadas), COR_UNICA)]
      },
      options: this.opcoesBarras('pastilhas', false, false)
    });

    const rendimento = d.porMaquina
      .filter(m => m.rendimentoMedioPastilha !== null)
      .sort((a, b) => (b.rendimentoMedioPastilha ?? 0) - (a.rendimentoMedioPastilha ?? 0))
      .slice(0, MAX_RANKING);
    this.criar(this.chartRendimentoEl, {
      type: 'bar',
      data: {
        labels: rendimento.map(m => m.maquina),
        datasets: [this.serie('Peças por pastilha', rendimento.map(m => m.rendimentoMedioPastilha ?? 0), COR_UNICA)]
      },
      options: this.opcoesBarras('peças/pastilha', false, true)
    });

    const operadores = [...d.porOperador].slice(0, MAX_RANKING);
    this.criar(this.chartOperadoresEl, {
      type: 'bar',
      data: {
        labels: operadores.map(o => o.operador),
        datasets: [
          this.serie('Peças boas', operadores.map(o => o.pecasBoas), COR_BOAS),
          this.serie('Peças refugadas', operadores.map(o => o.pecasRefugadas), COR_REFUGO),
        ]
      },
      options: this.opcoesBarras('peças', true, true)
    });

    const perdasOperador = d.porOperador.filter(o => o.pecasRefugadas > 0)
      .sort((a, b) => b.pecasRefugadas - a.pecasRefugadas).slice(0, MAX_RANKING);
    this.criar(this.chartPerdasOperadorEl, {
      type: 'bar',
      data: {
        labels: perdasOperador.map(o => o.operador),
        datasets: [this.serie('Peças refugadas', perdasOperador.map(o => o.pecasRefugadas), COR_REFUGO)]
      },
      options: this.opcoesBarras('peças refugadas', false, true)
    });

    const perdasMaquina = d.porMaquina.filter(m => m.pecasRefugadas > 0)
      .sort((a, b) => b.pecasRefugadas - a.pecasRefugadas).slice(0, MAX_RANKING);
    this.criar(this.chartPerdasMaquinaEl, {
      type: 'bar',
      data: {
        labels: perdasMaquina.map(m => m.maquina),
        datasets: [this.serie('Peças refugadas', perdasMaquina.map(m => m.pecasRefugadas), COR_REFUGO)]
      },
      options: this.opcoesBarras('peças refugadas', false, true)
    });
  }

  private criar(el: ElementRef<HTMLCanvasElement> | undefined, config: ChartConfiguration<'bar'>): void {
    if (!el || !config.data.labels?.length) return;
    this.charts.push(new Chart(el.nativeElement, config));
  }

  private serie(label: string, data: number[], cor: string) {
    return {
      label,
      data,
      backgroundColor: cor,
      borderColor: '#ffffff',
      borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
      borderRadius: 4,
      maxBarThickness: 28,
    };
  }

  private opcoesBarras(unidade: string, empilhado: boolean, horizontal: boolean): ChartConfiguration<'bar'>['options'] {
    const eixoValor = {
      stacked: empilhado,
      beginAtZero: true,
      title: { display: true, text: unidade, color: '#6b7280', font: { size: 11 } },
      ticks: { precision: 0, color: '#6b7280' },
      grid: { color: '#f3f4f6' },
      border: { display: false },
    };
    const eixoCategoria = {
      stacked: empilhado,
      grid: { display: false },
      ticks: { color: '#374151', autoSkip: true, maxRotation: 0 },
    };
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: empilhado, position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${unidade}`
          }
        }
      },
      scales: horizontal ? { x: eixoValor, y: eixoCategoria } : { x: eixoCategoria, y: eixoValor },
    };
  }

  // ── Utilitários ─────────────────────────────────────────────────────────────

  private rotuloDia(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  private toISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
