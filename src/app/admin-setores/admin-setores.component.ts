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
import { OpcaoCampo } from '../models/ordem-servico.model';
import { OpcoesService } from '../services/opcoes.service';
import { OpcaoCampoDialogComponent } from '../admin-opcoes/dialog/opcao-campo-dialog.component';

@Component({
  selector: 'app-admin-setores',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatProgressBarModule, MatChipsModule, MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './admin-setores.component.html',
  styleUrl: './admin-setores.component.scss',
})
export class AdminSetoresComponent implements OnInit {
  private readonly service = inject(OpcoesService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly tipo = 'Setor';
  readonly colunas = ['nome', 'ordem', 'ativo', 'acoes'];

  itens: OpcaoCampo[] = [];
  carregando = false;

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.service.listar(this.tipo).subscribe({
      next: lista => { this.itens = lista; this.carregando = false; },
      error: () => { this.carregando = false; },
    });
  }

  abrirAdicionar(): void {
    const ref = this.dialog.open(OpcaoCampoDialogComponent, { width: '420px', data: { tipo: 'Setor' } });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.criar({ tipo: this.tipo, nome: result.nome, ordem: result.ordem }).subscribe({
        next: () => { this.snack.open('Setor adicionado.', 'OK', { duration: 3000 }); this.carregar(); },
        error: () => this.snack.open('Erro ao adicionar.', 'OK', { duration: 3000 }),
      });
    });
  }

  abrirEditar(item: OpcaoCampo): void {
    const ref = this.dialog.open(OpcaoCampoDialogComponent, { width: '420px', data: { tipo: 'Setor', item } });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.service.atualizar(item.id, result).subscribe({
        next: () => { this.snack.open('Salvo com sucesso.', 'OK', { duration: 3000 }); this.carregar(); },
        error: () => this.snack.open('Erro ao salvar.', 'OK', { duration: 3000 }),
      });
    });
  }

  excluir(item: OpcaoCampo): void {
    if (!confirm(`Excluir o setor "${item.nome}"?`)) return;
    this.service.excluir(item.id).subscribe({
      next: () => { this.snack.open('Excluído.', 'OK', { duration: 3000 }); this.carregar(); },
      error: () => this.snack.open('Erro ao excluir.', 'OK', { duration: 3000 }),
    });
  }
}
