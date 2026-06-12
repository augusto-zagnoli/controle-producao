import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Pastilha, PASTILHA_STATUS_LABELS } from '../../models/pastilha.model';

export interface PastilhaViewDialogData {
  item: Pastilha;
}

@Component({
  selector: 'app-pastilha-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatChipsModule],
  template: `
    <h2 mat-dialog-title>Pastilha {{ data.item.codigo }}</h2>

    <mat-dialog-content>
      <div class="view-grid">
        <div class="view-field">
          <span class="view-label">Código</span>
          <span class="view-value">{{ data.item.codigo }}</span>
        </div>
        <div class="view-field">
          <span class="view-label">Status</span>
          <span class="view-value">
            <mat-chip [class]="'chip-status-' + data.item.status.toLowerCase()">
              {{ statusLabels[data.item.status] }}
            </mat-chip>
          </span>
        </div>

        <div class="view-field full">
          <span class="view-label">Descrição</span>
          <span class="view-value">{{ data.item.descricao || '—' }}</span>
        </div>

        <div class="view-field">
          <span class="view-label">Marca</span>
          <span class="view-value">{{ data.item.marca || '—' }}</span>
        </div>
        <div class="view-field">
          <span class="view-label">Modelo</span>
          <span class="view-value">{{ data.item.modelo || '—' }}</span>
        </div>

        <div class="view-field">
          <span class="view-label">Tipo</span>
          <span class="view-value">{{ data.item.tipo || '—' }}</span>
        </div>
        <div class="view-field">
          <span class="view-label">Quantidade de arestas</span>
          <span class="view-value">{{ data.item.quantidadeArestas }}</span>
        </div>

        <div class="view-field">
          <span class="view-label">Vida útil</span>
          <span class="view-value">{{ data.item.vidaUtilQuantidade | number:'1.0-2' }}</span>
        </div>
        <div class="view-field">
          <span class="view-label">Uso atual</span>
          <span class="view-value">{{ data.item.usoAtualQuantidade | number:'1.0-2' }}</span>
        </div>

        <div class="view-field">
          <span class="view-label">Restante</span>
          <span class="view-value">{{ data.item.restante | number:'1.0-2' }}</span>
        </div>
        <div class="view-field">
          <span class="view-label">Desgaste</span>
          <span class="view-value">{{ data.item.percentualDesgaste | number:'1.0-2' }}%</span>
        </div>

        <div class="view-field">
          <span class="view-label">Criado em</span>
          <span class="view-value">{{ data.item.criadoEm | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <div class="view-field">
          <span class="view-label">Atualizado em</span>
          <span class="view-value">{{ data.item.atualizadoEm | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .view-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 24px;
      min-width: 420px;
      padding-top: 8px;
    }
    .view-field { display: flex; flex-direction: column; gap: 2px; }
    .view-field.full { grid-column: 1 / -1; }
    .view-label { font-size: 12px; color: #6b7280; font-weight: 600; }
    .view-value { font-size: 14px; color: #111827; }
    mat-dialog-content { overflow: visible; }
    .chip-status-disponivel { background: #d1fae5 !important; color: #065f46 !important; }
    .chip-status-atencao    { background: #fef3c7 !important; color: #92400e !important; }
    .chip-status-esgotada   { background: #fee2e2 !important; color: #991b1b !important; }
    .chip-status-inativa    { background: #f3f4f6 !important; color: #6b7280 !important; }
  `]
})
export class PastilhaViewDialogComponent {
  readonly statusLabels = PASTILHA_STATUS_LABELS;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PastilhaViewDialogData) {}
}
