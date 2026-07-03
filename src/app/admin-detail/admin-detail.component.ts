import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistoricoItem, OrdemServico, OrdemServicoMaquina, STATUS_LABELS, STATUS_MAQUINA_LABELS } from '../models/ordem-servico.model';
import { UsoPastilha } from '../models/pastilha.model';
import { OrdensService } from '../services/ordens.service';
import { PastilhasService } from '../services/pastilhas.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FileViewerDialogComponent } from '../shared/file-viewer-dialog/file-viewer-dialog.component';

@Component({
  selector: 'app-admin-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './admin-detail.component.html',
  styleUrl: './admin-detail.component.scss'
})
export class AdminDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensService);
  private readonly pastilhasService = inject(PastilhasService);
  private readonly dialog = inject(MatDialog);
  readonly auth = inject(AuthService);

  ordem: OrdemServico | null = null;
  historico: HistoricoItem[] = [];
  usosPastilha: UsoPastilha[] = [];
  maquinas: OrdemServicoMaquina[] = [];
  carregando = true;
  erro = '';

  readonly statusLabels = STATUS_LABELS;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      ordem: this.service.obter(id),
      historico: this.service.historico(id),
      usosPastilha: this.pastilhasService.listarUsosPorOrdem(id),
      maquinas: this.service.maquinas(id)
    }).subscribe({
      next: ({ ordem, historico, usosPastilha, maquinas }) => {
        this.ordem = ordem;
        this.historico = historico;
        this.usosPastilha = usosPastilha;
        this.maquinas = maquinas;
        this.carregando = false;
      },
      error: () => { this.erro = 'Erro ao carregar ordem.'; this.carregando = false; }
    });
  }

  statusLabel(s: string): string {
    return STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s;
  }

  statusMaquinaLabel(s: string): string {
    return (STATUS_MAQUINA_LABELS as Record<string, string>)[s] ?? s;
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

  abrirArquivo(dadosBase64: string, contentType: string, nome: string, tipo: 'imagem' | 'pdf'): void {
    this.dialog.open(FileViewerDialogComponent, {
      data: { dadosBase64, contentType, nome, tipo },
      width: '90vw',
      maxWidth: '1100px',
      height: '90vh',
      panelClass: 'file-viewer-dialog'
    });
  }
}

