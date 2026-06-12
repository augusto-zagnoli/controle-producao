import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { OrdemServico, OrdemServicoStatus, STATUS_LABELS } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, MatTableModule, MatPaginatorModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly service = inject(OrdensService);

  @ViewChild(MatPaginator)
  set paginator(mp: MatPaginator) {
    if (mp) this.dataSource.paginator = mp;
  }

  busca = '';
  filtroStatus = '';
  ordens: OrdemServico[] = [];
  dataSource = new MatTableDataSource<OrdemServico>([]);
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

  readonly colunas = ['codigo', 'produto', 'valorUnitario', 'valorTotal', 'responsavel', 'prioridade', 'prazo', 'status', 'criadoEm', 'acoes'];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    this.service.listar(this.busca || undefined, this.filtroStatus || undefined).subscribe({
      next: (ordens) => {
        this.ordens = ordens;
        this.dataSource.data = ordens;
        if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
        this.carregando = false;
      },
      error: () => { this.erro = 'Erro ao carregar ordens.'; this.carregando = false; }
    });
  }

  statusLabel(s: OrdemServicoStatus): string {
    return STATUS_LABELS[s] ?? s;
  }

  excluir(id: number): void {
    if (!confirm('Excluir esta Ordem de Produção?')) return;
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

