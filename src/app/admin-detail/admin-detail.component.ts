import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistoricoItem, OrdemServico, STATUS_LABELS } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
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
    return origem === 'Tablet' ? 'Chão de Fábrica' : 'Administrativo';
  }

  acaoIcone(acao: string): string {
    if (acao.includes('Status')) return '🔄';
    if (acao.includes('Função') || acao.includes('Setor')) return '⚙️';
    if (acao.includes('Criado')) return '📋';
    if (acao.includes('Atualizado')) return '✏️';
    return '📝';
  }

  arquivoUrl(url: string | null | undefined): string {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) return url;
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }
}

