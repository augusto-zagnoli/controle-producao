import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Pastilha } from '../../models/pastilha.model';

export interface PastilhaFormDialogData {
  item?: Pastilha;
}

@Component({
  selector: 'app-pastilha-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Editar Pastilha' : 'Nova Pastilha' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código *</mat-label>
          <input matInput formControlName="codigo" placeholder="Ex: CNMG120408" />
          @if (form.get('codigo')?.hasError('required')) {
            <mat-error>Código é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrição *</mat-label>
          <input matInput formControlName="descricao" placeholder="Ex: Pastilha de torneamento" />
          @if (form.get('descricao')?.hasError('required')) {
            <mat-error>Descrição é obrigatória</mat-error>
          }
        </mat-form-field>

        <div class="dialog-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Marca</mat-label>
            <input matInput formControlName="marca" placeholder="Ex: Sandvik" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Modelo</mat-label>
            <input matInput formControlName="modelo" placeholder="Ex: CNMG 120408" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo</mat-label>
          <input matInput formControlName="tipo" placeholder="Ex: Acabamento" />
        </mat-form-field>

        <div class="dialog-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Vida Útil em Peças *</mat-label>
            <input matInput type="number" formControlName="vidaUtilQuantidade" min="0.01" step="0.01" />
            @if (form.get('vidaUtilQuantidade')?.hasError('required')) {
              <mat-error>Vida útil é obrigatória</mat-error>
            }
            @if (form.get('vidaUtilQuantidade')?.hasError('min')) {
              <mat-error>Vida útil deve ser maior que zero</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Quantidade de Arestas *</mat-label>
            <input matInput type="number" formControlName="quantidadeArestas" min="1" step="1" />
            @if (form.get('quantidadeArestas')?.hasError('required')) {
              <mat-error>Obrigatório</mat-error>
            }
            @if (form.get('quantidadeArestas')?.hasError('min')) {
              <mat-error>Mínimo 1</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="ajuda-visual">
          <div class="ajuda-header">
            <mat-icon>info</mat-icon>
            <span>Como calcular a vida útil</span>
          </div>
          <p class="ajuda-exemplo">
            Exemplo: pastilha com <strong>4 arestas</strong>, cada aresta durando
            <strong>500 peças</strong> → vida útil total estimada de <strong>2000 peças</strong>.
          </p>
          @if (vidaUtilTotal > 0 && arestas > 0) {
            <div class="ajuda-resumo">
              <div class="ajuda-linha">
                <span>Vida útil por aresta:</span>
                <strong>{{ vidaUtilPorAresta | number:'1.0-2' }} peças</strong>
              </div>
              <div class="ajuda-linha">
                <span>Quantidade de arestas:</span>
                <strong>{{ arestas }}</strong>
              </div>
              <div class="ajuda-linha">
                <span>Vida útil total estimada:</span>
                <strong>{{ vidaUtilTotal | number:'1.0-2' }} peças</strong>
              </div>
            </div>
          }
        </div>

        <mat-checkbox formControlName="ativa" color="primary">Ativa</mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()" [disabled]="form.invalid">
        {{ data.item ? 'Salvar' : 'Adicionar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 380px; padding-top: 8px; }
    .full-width { width: 100%; }
    .dialog-row { display: flex; gap: 12px; }
    .half-width { flex: 1; }
    mat-dialog-content { overflow: visible; }

    .ajuda-visual {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 4px;
    }
    .ajuda-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #0369a1;
      margin-bottom: 4px;
    }
    .ajuda-header mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .ajuda-exemplo { margin: 0; font-size: 12.5px; color: #475569; line-height: 1.5; }
    .ajuda-resumo {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #bae6fd;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ajuda-linha {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      color: #0c4a6e;
    }
  `]
})
export class PastilhaFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PastilhaFormDialogComponent>);

  form: ReturnType<FormBuilder['group']>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: PastilhaFormDialogData) {
    this.form = this.fb.group({
      codigo: [data.item?.codigo ?? '', [Validators.required, Validators.minLength(1)]],
      descricao: [data.item?.descricao ?? '', [Validators.required, Validators.minLength(1)]],
      marca: [data.item?.marca ?? ''],
      modelo: [data.item?.modelo ?? ''],
      tipo: [data.item?.tipo ?? ''],
      vidaUtilQuantidade: [data.item?.vidaUtilQuantidade ?? null, [Validators.required, Validators.min(0.01)]],
      quantidadeArestas: [data.item?.quantidadeArestas ?? 1, [Validators.required, Validators.min(1)]],
      ativa: [data.item?.ativa ?? true],
    });
  }

  get vidaUtilTotal(): number {
    const v = Number(this.form.get('vidaUtilQuantidade')?.value);
    return isNaN(v) ? 0 : v;
  }

  get arestas(): number {
    const v = Number(this.form.get('quantidadeArestas')?.value);
    return isNaN(v) || v <= 0 ? 0 : v;
  }

  get vidaUtilPorAresta(): number {
    return this.arestas > 0 ? this.vidaUtilTotal / this.arestas : 0;
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      codigo: String(v.codigo).trim(),
      descricao: String(v.descricao).trim(),
      marca: v.marca?.trim() || null,
      modelo: v.modelo?.trim() || null,
      tipo: v.tipo?.trim() || null,
      vidaUtilQuantidade: Number(v.vidaUtilQuantidade),
      quantidadeArestas: Number(v.quantidadeArestas),
      ativa: v.ativa,
    });
  }
}
