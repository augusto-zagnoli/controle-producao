import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

export type TipoColuna = 'texto' | 'numero' | 'decimal' | 'percentual' | 'data';

export interface ColunaTabela<T> {
  chave: string;
  titulo: string;
  tipo?: TipoColuna;
  valor: (linha: T) => string | number | null;
}

// Tabela com ordenação e paginação no cliente, para conjuntos já agregados pela API.
@Component({
  selector: 'app-tabela-analitica',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSortModule, MatPaginatorModule],
  template: `
    @if (dados.length) {
      <div class="tabela-scroll">
        <table mat-table [dataSource]="fonte" matSort [matSortActive]="ordenarPor" matSortDirection="desc">
          @for (c of colunas; track c.chave) {
            <ng-container [matColumnDef]="c.chave">
              <th mat-header-cell *matHeaderCellDef mat-sort-header [class.num]="ehNumerica(c)">{{ c.titulo }}</th>
              <td mat-cell *matCellDef="let linha" [class.num]="ehNumerica(c)">{{ formatar(c, linha) }}</td>
            </ng-container>
          }
          <tr mat-header-row *matHeaderRowDef="chaves"></tr>
          <tr mat-row *matRowDef="let linha; columns: chaves"></tr>
        </table>
      </div>
      @if (dados.length > tamanhoPagina) {
        <mat-paginator [pageSize]="tamanhoPagina" [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
      }
    } @else {
      <p class="empty">{{ mensagemVazia }}</p>
    }
  `,
  styles: [`
    .tabela-scroll { overflow-x: auto; }
    table { width: 100%; }
    th.mat-mdc-header-cell { font-size: 12px; text-transform: uppercase; color: #6b7280; background: #f9fafb; white-space: nowrap; }
    td.mat-mdc-cell { font-size: 14px; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    th.num ::ng-deep .mat-sort-header-container { justify-content: flex-end; }
    .empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 14px; margin: 0; }
  `]
})
export class TabelaAnaliticaComponent<T> implements OnChanges, AfterViewInit {
  @Input({ required: true }) colunas: ColunaTabela<T>[] = [];
  @Input({ required: true }) dados: T[] = [];
  @Input() ordenarPor = '';
  @Input() tamanhoPagina = 10;
  @Input() mensagemVazia = 'Sem dados para os filtros aplicados.';

  readonly fonte = new MatTableDataSource<T>([]);

  @ViewChild(MatSort) set sort(s: MatSort | undefined) { if (s) this.fonte.sort = s; }
  @ViewChild(MatPaginator) set paginator(p: MatPaginator | undefined) { this.fonte.paginator = p ?? null; }

  get chaves(): string[] { return this.colunas.map(c => c.chave); }

  ngOnChanges(): void {
    this.fonte.data = this.dados;
    this.fonte.sortingDataAccessor = (linha, chave) => {
      const valor = this.colunas.find(c => c.chave === chave)?.valor(linha);
      // null (não calculável) vai para o fim em qualquer direção numérica descendente
      return valor ?? Number.NEGATIVE_INFINITY;
    };
  }

  ngAfterViewInit(): void {
    this.fonte.data = this.dados;
  }

  ehNumerica(c: ColunaTabela<T>): boolean {
    return c.tipo === 'numero' || c.tipo === 'decimal' || c.tipo === 'percentual';
  }

  formatar(c: ColunaTabela<T>, linha: T): string {
    return formatarValor(c.valor(linha), c.tipo ?? 'texto');
  }
}

export function formatarValor(valor: string | number | null | undefined, tipo: TipoColuna): string {
  if (valor === null || valor === undefined || valor === '') return tipo === 'texto' ? '—' : 'n/c';
  switch (tipo) {
    case 'numero':
      return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
    case 'decimal':
      return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'percentual':
      return `${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    case 'data':
      return new Date(String(valor)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    default:
      return String(valor);
  }
}
