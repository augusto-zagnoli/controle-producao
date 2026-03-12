import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdemProducao, STATUS_OP_LABELS } from '../ordem-servico.model';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producao.component.html',
  styleUrl: './producao.component.scss'
})
export class ProducaoComponent {
  private readonly service = inject(OrdensServicoService);
  private readonly destroyRef = inject(DestroyRef);

  busca = '';
  ordens: OrdemProducao[] = [];
  ordensFiltradas: OrdemProducao[] = [];

  constructor() {
    this.service.ordens$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ordens) => {
      // Tablet mostra apenas ordens pendentes ou em produção
      this.ordens = ordens.filter(o => o.status !== 'cancelada' && o.status !== 'concluida');
      this.filtrar();
    });
  }

  filtrar(): void {
    const termo = this.busca.trim().toLowerCase();
    this.ordensFiltradas = !termo
      ? [...this.ordens]
      : this.ordens.filter(o =>
          o.nomePeca.toLowerCase().includes(termo) ||
          o.numeroOP.toString().includes(termo) ||
          (o.cliente ?? '').toLowerCase().includes(termo)
        );
  }

  statusLabel(status: OrdemProducao['status']): string {
    return STATUS_OP_LABELS[status];
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  operacoesPendentes(o: OrdemProducao): number {
    return o.operacoes.filter(op => op.status !== 'concluida').length;
  }
}

