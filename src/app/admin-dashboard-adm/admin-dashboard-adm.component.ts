import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { filter, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { DashboardAdm, MaquinaStats } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';

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
export class AdminDashboardAdmComponent implements OnInit, OnDestroy {
  private readonly service = inject(OrdensService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  dados: DashboardAdm | null = null;
  carregando = true;
  erro = '';

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
    if (ini.getTime() === fim.getTime())
      return fmt(ini);
    return `${fmt(ini)} — ${fmt(fim)}`;
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

  ngOnDestroy(): void {
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
      next: d => { this.dados = d; this.carregando = false; },
      error: () => { this.erro = 'Erro ao carregar dados.'; this.carregando = false; },
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
