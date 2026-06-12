import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Pastilha, PastilhaDashboard, PastilhaStatus, PASTILHA_STATUS_LABELS } from '../models/pastilha.model';
import { PastilhasService } from '../services/pastilhas.service';
import { PastilhaFormDialogComponent } from './dialog/pastilha-form-dialog.component';
import { PastilhaViewDialogComponent } from './dialog/pastilha-view-dialog.component';

@Component({
  selector: 'app-admin-pastilhas',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatProgressBarModule, MatChipsModule, MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './admin-pastilhas.component.html',
  styleUrl: './admin-pastilhas.component.scss',
})
export class AdminPastilhasComponent implements OnInit {
  private readonly service = inject(PastilhasService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly colunas = ['codigo', 'descricao', 'marca', 'modelo', 'vidaUtil', 'usoAtual', 'restante', 'desgaste', 'status', 'acoes'];

  itens: Pastilha[] = [];
  dashboard: PastilhaDashboard | null = null;
  carregando = false;

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.service.listar().subscribe({
      next: lista => { this.itens = lista; this.carregando = false; },
      error: () => { this.carregando = false; },
    });
    this.service.dashboard().subscribe({
      next: dash => { this.dashboard = dash; },
      error: () => {},
    });
  }

  abrirNova(): void {
    const ref = this.dialog.open(PastilhaFormDialogComponent, { width: '480px', data: {} });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.criar(result).subscribe({
        next: () => { this.snack.open('Pastilha cadastrada.', 'OK', { duration: 3000 }); this.carregar(); },
        error: () => this.snack.open('Erro ao cadastrar pastilha.', 'OK', { duration: 3000 }),
      });
    });
  }

  abrirEditar(item: Pastilha): void {
    const ref = this.dialog.open(PastilhaFormDialogComponent, { width: '480px', data: { item } });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.atualizar(item.id, result).subscribe({
        next: () => { this.snack.open('Pastilha atualizada.', 'OK', { duration: 3000 }); this.carregar(); },
        error: () => this.snack.open('Erro ao atualizar pastilha.', 'OK', { duration: 3000 }),
      });
    });
  }

  abrirVisualizar(item: Pastilha): void {
    this.dialog.open(PastilhaViewDialogComponent, { width: '500px', data: { item } });
  }

  statusLabel(status: string): string {
    return PASTILHA_STATUS_LABELS[status as PastilhaStatus] ?? status;
  }

  alternarAtiva(item: Pastilha): void {
    const acao = item.ativa ? 'inativar' : 'ativar';
    if (!confirm(`Deseja ${acao} a pastilha "${item.codigo}"?`)) return;

    const dto = {
      codigo: item.codigo,
      descricao: item.descricao,
      marca: item.marca,
      modelo: item.modelo,
      tipo: item.tipo,
      vidaUtilQuantidade: item.vidaUtilQuantidade,
      quantidadeArestas: item.quantidadeArestas,
      ativa: !item.ativa,
    };

    this.service.atualizar(item.id, dto).subscribe({
      next: () => { this.snack.open(`Pastilha ${item.ativa ? 'inativada' : 'ativada'}.`, 'OK', { duration: 3000 }); this.carregar(); },
      error: () => this.snack.open('Erro ao atualizar pastilha.', 'OK', { duration: 3000 }),
    });
  }
}
