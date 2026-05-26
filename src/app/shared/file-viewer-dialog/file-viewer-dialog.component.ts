import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface FileViewerData {
  url: string;
  nome: string;
  tipo: 'imagem' | 'pdf';
}

@Component({
  selector: 'app-file-viewer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <span class="dialog-title" [title]="data.nome">{{ data.nome }}</span>
      <button mat-icon-button (click)="fechar()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content class="dialog-content">
      @if (data.tipo === 'imagem') {
        <img [src]="data.url" [alt]="data.nome" class="imagem-full" />
      } @else {
        <iframe [src]="safeUrl" class="pdf-frame" frameborder="0"></iframe>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <a [href]="data.url" target="_blank" rel="noopener" mat-stroked-button>
        <mat-icon>open_in_new</mat-icon> Abrir em nova aba
      </a>
      <button mat-flat-button color="primary" (click)="fechar()">Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .dialog-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px 8px; border-bottom: 1px solid #e5e7eb;
    }
    .dialog-title { font-size: 15px; font-weight: 600; color: #111; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 360px; }
    .dialog-content { padding: 0 !important; flex: 1; display: flex; align-items: center; justify-content: center; background: #1a1a1a; overflow: hidden; }
    .imagem-full { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
    .pdf-frame { width: 100%; height: 100%; min-height: 70vh; border: none; }
    mat-dialog-actions { padding: 8px 16px; border-top: 1px solid #e5e7eb; gap: 8px; }
  `]
})
export class FileViewerDialogComponent {
  safeUrl: SafeResourceUrl;

  constructor(
    public dialogRef: MatDialogRef<FileViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileViewerData,
    sanitizer: DomSanitizer
  ) {
    this.safeUrl = sanitizer.bypassSecurityTrustResourceUrl(data.url);
  }

  fechar(): void { this.dialogRef.close(); }
}
