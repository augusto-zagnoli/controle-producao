import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { OrdemServico, HistoricoItem, STATUS_LABELS, OrdemServicoStatus } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';

@Component({
  selector: 'app-producao-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producao-detail.component.html',
  styleUrl: './producao-detail.component.scss'
})
export class ProducaoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensService);

  ordem: OrdemServico | null = null;
  historico: HistoricoItem[] = [];
  carregando = true;
  erro = '';

  modalAberto = false;
  novoStatus: OrdemServicoStatus = 'EmProducao';
  observacao = '';
  fotoOperador: File | null = null;
  fotoPreview: string | null = null;
  salvando = false;
  erroModal = '';

  readonly statusOptions: { value: OrdemServicoStatus; label: string }[] = [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'EmProducao', label: 'Em Producao' },
    { value: 'Pausada', label: 'Pausada' },
    { value: 'Finalizada', label: 'Finalizada' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregando = true;
    forkJoin({
      ordem: this.service.obter(id),
      historico: this.service.historico(id)
    }).subscribe({
      next: ({ ordem, historico }) => {
        this.ordem = ordem;
        this.historico = historico;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar a ordem de servico.';
        this.carregando = false;
      }
    });
  }

  abrirModal(): void {
    if (!this.ordem) return;
    this.novoStatus = this.ordem.status;
    this.observacao = '';
    this.fotoOperador = null;
    this.fotoPreview = null;
    this.erroModal = '';
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  onFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fotoOperador = file;
    const reader = new FileReader();
    reader.onload = () => { this.fotoPreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  confirmarStatus(): void {
    if (!this.fotoOperador) {
      this.erroModal = 'A foto do operador e obrigatoria.';
      return;
    }
    if (!this.ordem) return;
    this.salvando = true;
    this.erroModal = '';

    this.service.alterarStatus(this.ordem.id, this.novoStatus, this.observacao, this.fotoOperador).pipe(
      switchMap(() => forkJoin({
        ordem: this.service.obter(this.ordem!.id),
        historico: this.service.historico(this.ordem!.id)
      }))
    ).subscribe({
      next: ({ ordem, historico }) => {
        this.ordem = ordem;
        this.historico = historico;
        this.modalAberto = false;
        this.salvando = false;
      },
      error: () => {
        this.erroModal = 'Erro ao alterar status. Tente novamente.';
        this.salvando = false;
      }
    });
  }

  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR');
  }
}
