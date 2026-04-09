import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdemServico, STATUS_LABELS } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producao.component.html',
  styleUrl: './producao.component.scss'
})
export class ProducaoComponent implements OnInit {
  private readonly service = inject(OrdensService);

  busca = '';
  status = '';
  ordens: OrdemServico[] = [];
  carregando = false;
  erro = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = '';
    this.service.listar(this.busca, this.status).subscribe({
      next: lista => {
        // Tablet shows all non-Finalizada orders
        this.ordens = lista.filter(o => o.status !== 'Finalizada');
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar ordens.';
        this.carregando = false;
      }
    });
  }

  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  }
}

