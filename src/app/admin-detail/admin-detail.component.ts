import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { STATUS_LABELS } from '../ordem-servico.model';
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
  readonly ordem$ = this.route.paramMap.pipe(
    switchMap((params) => this.service.getById(params.get('id') ?? ''))
  );

  statusLabel(status: keyof typeof STATUS_LABELS): string {
    return STATUS_LABELS[status];
  }
}
