import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistoricoItem, OrdemServico, STATUS_LABELS } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-detail.component.html',
  styleUrl: './admin-detail.component.scss'
})
export class AdminDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensService);
  readonly auth = inject(AuthService);

  ordem: OrdemServico | null = null;
  historico: HistoricoItem[] = [];
  carregando = true;
  erro = '';

  readonly statusLabels = STATUS_LABELS;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      ordem: this.service.obter(id),
      historico: this.service.historico(id)
    }).subscribe({
      next: ({ ordem, historico }) => {
        this.ordem = ordem;
        this.historico = historico;
        this.carregando = false;
      },
      error: () => { this.erro = 'Erro ao carregar ordem.'; this.carregando = false; }
    });
  }

  statusLabel(s: string): string {
    return STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s;
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR');
  }

  origemLabel(origem: string): string {
    return origem === 'Tablet' ? 'Tablet (Chão de Fábrica)' : 'Administrativo';
  }
}

