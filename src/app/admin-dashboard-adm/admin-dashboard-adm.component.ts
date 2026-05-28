import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { DashboardAdm, MaquinaStats } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';

@Component({
  selector: 'app-admin-dashboard-adm',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './admin-dashboard-adm.component.html',
  styleUrl: './admin-dashboard-adm.component.scss',
})
export class AdminDashboardAdmComponent implements OnInit {
  private readonly service = inject(OrdensService);

  dados: DashboardAdm | null = null;
  carregando = true;
  erro = '';

  readonly mesAtual = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  ngOnInit(): void {
    this.service.dashboardAdm().subscribe({
      next: d => { this.dados = d; this.carregando = false; },
      error: () => { this.erro = 'Erro ao carregar dados.'; this.carregando = false; },
    });
  }

  totalPecasMaquinas(lista: MaquinaStats[]): number {
    return lista.reduce((s, m) => s + m.quantidade, 0);
  }

  totalValorMaquinas(lista: MaquinaStats[]): number {
    return lista.reduce((s, m) => s + m.valor, 0);
  }
}
