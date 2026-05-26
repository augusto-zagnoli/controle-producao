import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { OpcaoCampo } from '../../models/ordem-servico.model';

export interface OpcaoCampoDialogData {
  tipo: string;
  item?: OpcaoCampo;
}

@Component({
  selector: 'app-opcao-campo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.item ? 'Editar' : 'Adicionar' }} {{ data.tipo }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="nome" placeholder="Ex: Operador" />
          @if (form.get('nome')?.hasError('required')) {
            <mat-error>Nome é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ordem de exibição</mat-label>
          <input matInput type="number" formControlName="ordem" min="0" />
        </mat-form-field>

        @if (data.item) {
          <mat-checkbox formControlName="ativo" color="primary">Ativo</mat-checkbox>
        }
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
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 320px; padding-top: 8px; }
    .full-width { width: 100%; }
    mat-dialog-content { overflow: visible; }
  `]
})
export class OpcaoCampoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OpcaoCampoDialogComponent>);

  form: ReturnType<FormBuilder['group']>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: OpcaoCampoDialogData) {
    this.form = this.fb.group({
      nome:  [data.item?.nome  ?? '', [Validators.required, Validators.minLength(1)]],
      ordem: [data.item?.ordem ?? 0],
      ativo: [data.item?.ativo ?? true],
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmar(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
