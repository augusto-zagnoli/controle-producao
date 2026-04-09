import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdemServico, OrdemServicoStatus, STATUS_LABELS } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly service = inject(OrdensService);

  busca = '';
  filtroStatus = '';
  ordens: OrdemServico[] = [];
  carregando = false;
  erro = '';

  readonly statusLabels = STATUS_LABELS;
  readonly statusOpcoes: Array<{ valor: string; label: string }> = [
    { valor: '', label: 'Todos' },
    { valor: 'Pendente', label: 'Pendente' },
    { valor: 'EmProducao', label: 'Em Produção' },
    { valor: 'Pausada', label: 'Pausada' },
    { valor: 'Finalizada', label: 'Finalizada' }
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    this.service.listar(this.busca || undefined, this.filtroStatus || undefined).subscribe({
      next: (ordens) => { this.ordens = ordens; this.carregando = false; },
      error: () => { this.erro = 'Erro ao carregar ordens.'; this.carregando = false; }
    });
  }

  statusLabel(s: OrdemServicoStatus): string {
    return STATUS_LABELS[s] ?? s;
  }

  excluir(id: number): void {
    if (!confirm('Excluir esta Ordem de Serviço?')) return;
    this.service.excluir(id).subscribe({
      next: () => this.carregar(),
      error: () => alert('Erro ao excluir.')
    });
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  get totalPendente(): number { return this.ordens.filter(o => o.status === 'Pendente').length; }
  get totalEmProducao(): number { return this.ordens.filter(o => o.status === 'EmProducao').length; }
  get totalPausada(): number { return this.ordens.filter(o => o.status === 'Pausada').length; }
  get totalFinalizada(): number { return this.ordens.filter(o => o.status === 'Finalizada').length; }
}

