import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { filter, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import {
  Chart,
  BarController, BarElement,
  LineController, LineElement, PointElement,
  PieController, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend,
  Filler
} from 'chart.js';
import { DashboardAdm, HistoricoMensalItem, MaquinaStats, STATUS_LABELS } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';

Chart.register(
  BarController, BarElement,
  LineController, LineElement, PointElement,
  PieController, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend,
  Filler
);

// Ordem categórica fixa — nunca ciclar nem gerar cores novas (ver skill dataviz)
const PALETA_CATEGORICA = [
  '#2a78d6', // blue
  '#008300', // green
  '#e87ba4', // magenta
  '#eda100', // yellow
  '#1baf7a', // aqua
  '#eb6834', // orange
  '#4a3aa7', // violet
  '#e34948', // red
];

interface FatiaPizza {
  label: string;
  valor: number;
}

@Component({
  selector: 'app-admin-dashboard-adm',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DecimalPipe, ReactiveFormsModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
  templateUrl: './admin-dashboard-adm.component.html',
  styleUrl: './admin-dashboard-adm.component.scss',
})
export class AdminDashboardAdmComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly service = inject(OrdensService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('chartPecasEl') chartPecasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartValorEl') chartValorEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartValorMaquinaEl') chartValorMaquinaEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartValorSetorEl') chartValorSetorEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartValorOrdemEl') chartValorOrdemEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartValorStatusEl') chartValorStatusEl?: ElementRef<HTMLCanvasElement>;

  dados: DashboardAdm | null = null;
  carregando = true;
  erro = '';

  historico: HistoricoMensalItem[] = [];
  carregandoHistorico = true;

  private chartPecas: Chart | null = null;
  private chartValor: Chart | null = null;
  private chartValorMaquina: Chart | null = null;
  private chartValorSetor: Chart | null = null;
  private chartValorOrdem: Chart | null = null;
  private chartValorStatus: Chart | null = null;
  private viewReady = false;

  private readonly hoje = new Date();

  readonly range = this.fb.group({
    inicio: [new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1) as Date | null],
    fim:    [this.hoje as Date | null],
  });

  get periodoLabel(): string {
    const ini = this.range.value.inicio;
    const fim = this.range.value.fim;
    if (!ini || !fim) return '';
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR');
    const mesmoMes = ini.getMonth() === fim.getMonth() && ini.getFullYear() === fim.getFullYear();
    const diaUm    = ini.getDate() === 1;
    const ultimoDia = fim.getDate() === new Date(fim.getFullYear(), fim.getMonth() + 1, 0).getDate();
    if (mesmoMes && diaUm && ultimoDia)
      return ini.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    if (ini.getTime() === fim.getTime()) return fmt(ini);
    return `${fmt(ini)} — ${fmt(fim)}`;
  }

  get variacaoPecas(): number | null {
    if (!this.dados || this.dados.pecasPeriodoAnterior === 0) return null;
    return ((this.dados.pecasProduzirasMes - this.dados.pecasPeriodoAnterior) / this.dados.pecasPeriodoAnterior) * 100;
  }

  get variacaoValor(): number | null {
    if (!this.dados || this.dados.valorPeriodoAnterior === 0) return null;
    return ((this.dados.valorTotalProduzido - this.dados.valorPeriodoAnterior) / this.dados.valorPeriodoAnterior) * 100;
  }

  ngOnInit(): void {
    this.carregar();
    this.range.valueChanges.pipe(
      filter(v => !!v.inicio && !!v.fim && v.fim >= v.inicio),
      distinctUntilChanged((a, b) =>
        a.inicio?.getTime() === b.inicio?.getTime() &&
        a.fim?.getTime()    === b.fim?.getTime()
      ),
      takeUntil(this.destroy$)
    ).subscribe(() => this.carregar());
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.service.dashboardHistoricoMensal(6).pipe(takeUntil(this.destroy$)).subscribe({
      next: h => {
        this.historico = h;
        this.carregandoHistorico = false;
        this.cdr.detectChanges(); // garante que os <canvas> do @else estejam no DOM
        this.renderCharts();
      },
      error: () => { this.carregandoHistorico = false; }
    });
  }

  ngOnDestroy(): void {
    this.chartPecas?.destroy();
    this.chartValor?.destroy();
    this.chartValorMaquina?.destroy();
    this.chartValorSetor?.destroy();
    this.chartValorOrdem?.destroy();
    this.chartValorStatus?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  selecionarHoje(): void {
    const d = new Date();
    this.range.setValue({ inicio: d, fim: d });
  }

  selecionarSemana(): void {
    const hoje = new Date();
    const inicio = new Date(hoje);
    const dia = hoje.getDay() || 7;
    inicio.setDate(hoje.getDate() - dia + 1);
    this.range.setValue({ inicio, fim: hoje });
  }

  selecionarMes(): void {
    const hoje = new Date();
    this.range.setValue({
      inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
      fim: hoje,
    });
  }

  private carregar(): void {
    const { inicio, fim } = this.range.value;
    if (!inicio || !fim) return;
    this.carregando = true;
    this.erro = '';
    this.service.dashboardAdm(this.toISO(inicio), this.toISO(fim)).subscribe({
      next: d => {
        this.dados = d;
        this.carregando = false;
        this.cdr.detectChanges(); // garante que os <canvas> das pizzas estejam no DOM
        this.renderPieCharts();
      },
      error: () => { this.erro = 'Erro ao carregar dados.'; this.carregando = false; },
    });
  }

  private renderCharts(): void {
    if (!this.viewReady || !this.historico.length) return;

    const labels = this.historico.map(h => h.label);
    const pecas  = this.historico.map(h => h.pecasProduzidas);
    const valores = this.historico.map(h => h.valorProduzido);

    // Gráfico de peças
    this.chartPecas?.destroy();
    this.chartPecas = new Chart(this.chartPecasEl.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Peças Produzidas',
          data: pecas,
          backgroundColor: 'rgba(37,99,235,0.75)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${Number(ctx.raw).toLocaleString('pt-BR')} peças`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: '#f3f4f6' }
          },
          x: { grid: { display: false } }
        }
      }
    });

    // Gráfico de valor
    this.chartValor?.destroy();
    this.chartValor = new Chart(this.chartValorEl.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Valor Produzido',
          data: valores,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#16a34a',
          pointRadius: 4,
          tension: 0.35,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
            },
            grid: { color: '#f3f4f6' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private renderPieCharts(): void {
    if (!this.dados) return;

    this.chartValorMaquina = this.criarPie(
      this.chartValorMaquina, this.chartValorMaquinaEl,
      this.dados.valorEmProducaoPorMaquina.map(m => ({ label: m.maquina, valor: m.valor }))
    );
    this.chartValorSetor = this.criarPie(
      this.chartValorSetor, this.chartValorSetorEl,
      this.dados.valorEmProducaoPorSetor.map(s => ({ label: s.setor, valor: s.valor }))
    );
    this.chartValorOrdem = this.criarPie(
      this.chartValorOrdem, this.chartValorOrdemEl,
      this.dados.valorEmProducaoPorOrdem.map(o => ({ label: `#${o.codigo} ${o.nomeProduto}`, valor: o.valor }))
    );
    this.chartValorStatus = this.criarPie(
      this.chartValorStatus, this.chartValorStatusEl,
      this.dados.valorPorStatus.map(s => ({ label: STATUS_LABELS[s.status], valor: s.valor }))
    );
  }

  /** Cria (ou recria) um gráfico de pizza. Além de 8 fatias, agrupa a cauda em "Outras" (ver skill dataviz). */
  private criarPie(
    chartAtual: Chart | null,
    el: ElementRef<HTMLCanvasElement> | undefined,
    itens: FatiaPizza[]
  ): Chart | null {
    chartAtual?.destroy();
    if (!el || !itens.length) return null;

    const ordenado = [...itens].sort((a, b) => b.valor - a.valor);
    const limite = PALETA_CATEGORICA.length;
    let fatias = ordenado;
    if (ordenado.length > limite) {
      const principais = ordenado.slice(0, limite - 1);
      const outrasValor = ordenado.slice(limite - 1).reduce((s, i) => s + i.valor, 0);
      fatias = [...principais, { label: 'Outras', valor: outrasValor }];
    }

    const total = fatias.reduce((s, i) => s + i.valor, 0);
    const cores = fatias.map((_, i) => PALETA_CATEGORICA[i]);

    return new Chart(el.nativeElement, {
      type: 'pie',
      data: {
        labels: fatias.map(i => i.label),
        datasets: [{
          data: fatias.map(i => i.valor),
          backgroundColor: cores,
          borderColor: '#ffffff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const valor = Number(ctx.raw);
                const pct = total > 0 ? (valor / total) * 100 : 0;
                return ` ${ctx.label}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%)`;
              }
            }
          }
        }
      }
    });
  }

  private toISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  totalPecasMaquinas(lista: MaquinaStats[]): number {
    return lista.reduce((s, m) => s + m.quantidade, 0);
  }

  totalValorMaquinas(lista: MaquinaStats[]): number {
    return lista.reduce((s, m) => s + m.valor, 0);
  }
}
