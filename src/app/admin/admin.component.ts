import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdemProducao, STATUS_OP_LABELS, StatusOP } from '../ordem-servico.model';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private readonly service = inject(OrdensServicoService);
  private readonly destroyRef = inject(DestroyRef);

  busca = '';
  filtroStatus: StatusOP | '' = '';
  ordens: OrdemProducao[] = [];
  ordensFiltradas: OrdemProducao[] = [];

  constructor() {
    this.service.ordens$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ordens) => {
      this.ordens = ordens;
      this.filtrar();
    });
  }

  filtrar(): void {
    const termo = this.busca.trim().toLowerCase();
    this.ordensFiltradas = this.ordens.filter((o) => {
      const matchBusca =
        !termo ||
        o.nomePeca.toLowerCase().includes(termo) ||
        o.numeroOP.toString().includes(termo) ||
        (o.cliente ?? '').toLowerCase().includes(termo);
      const matchStatus = !this.filtroStatus || o.status === this.filtroStatus;
      return matchBusca && matchStatus;
    });
  }

  statusLabel(status: StatusOP): string {
    return STATUS_OP_LABELS[status];
  }

  excluir(id: string): void {
    if (confirm('Excluir esta Ordem de Produção?')) {
      this.service.excluir(id);
    }
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  get totalPendente(): number { return this.ordens.filter(o => o.status === 'pendente').length; }
  get totalEmProducao(): number { return this.ordens.filter(o => o.status === 'em_producao').length; }
  get totalConcluida(): number { return this.ordens.filter(o => o.status === 'concluida').length; }
}

