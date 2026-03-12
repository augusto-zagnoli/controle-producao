import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdemServico, STATUS_LABELS } from '../ordem-servico.model';
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

  filtro = '';
  ordens: OrdemServico[] = [];
  ordensFiltradas: OrdemServico[] = [];

  constructor() {
    this.service.ordens$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ordens) => {
      this.ordens = ordens;
      this.aplicarFiltro();
    });
  }

  aplicarFiltro(): void {
    const termo = this.filtro.trim().toLowerCase();
    this.ordensFiltradas = !termo
      ? [...this.ordens]
      : this.ordens.filter(
          (o) =>
            o.numero.toLowerCase().includes(termo) ||
            o.descricao.toLowerCase().includes(termo) ||
            o.cliente.toLowerCase().includes(termo)
        );
  }

  statusLabel(status: OrdemServico['status']): string {
    return STATUS_LABELS[status];
  }
}
