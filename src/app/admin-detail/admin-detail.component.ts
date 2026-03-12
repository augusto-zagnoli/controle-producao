import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, map } from 'rxjs';
import { Apontamento, OrdemProducao, STATUS_OP_LABELS, STATUS_OPERACAO_LABELS } from '../ordem-servico.model';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-admin-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-detail.component.html',
  styleUrl: './admin-detail.component.scss'
})
export class AdminDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensServicoService);

  readonly ordemId$ = this.route.paramMap.pipe(map(p => p.get('id') ?? ''));
  readonly ordem$ = this.route.paramMap.pipe(
    switchMap((params) => this.service.getById(params.get('id') ?? ''))
  );

  getApontamentos(ordemId: string): Apontamento[] {
    return this.service.getApontamentos(ordemId);
  }

  statusOPLabel(s: OrdemProducao['status']): string { return STATUS_OP_LABELS[s]; }
  statusOpLabel(s: string): string { return STATUS_OPERACAO_LABELS[s as keyof typeof STATUS_OPERACAO_LABELS] ?? s; }

  formatarData(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  formatarDataHora(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR');
  }
}

