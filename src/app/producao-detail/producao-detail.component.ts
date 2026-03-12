import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { OrdemServico, STATUS_LABELS, StatusOrdem } from '../ordem-servico.model';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-producao-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producao-detail.component.html',
  styleUrl: './producao-detail.component.scss'
})
export class ProducaoDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensServicoService);
  private readonly destroyRef = inject(DestroyRef);

  ordem: OrdemServico | undefined;
  statusNovo: StatusOrdem = 'em_producao';
  observacao = '';
  fotoBase64 = '';

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.service.getById(params.get('id') ?? '')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((ordem) => {
        this.ordem = ordem;
        this.statusNovo = ordem?.status ?? 'em_producao';
      });
  }

  async onFoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.fotoBase64 = '';
      return;
    }
    this.fotoBase64 = await this.readFile(file);
  }

  alterarStatus(): void {
    if (!this.ordem) {
      return;
    }
    if (!this.fotoBase64) {
      alert('É obrigatório tirar foto de quem alterou a ordem.');
      return;
    }
    this.service.mudarStatus(this.ordem.id, this.statusNovo, this.observacao, this.fotoBase64);
    this.observacao = '';
    this.fotoBase64 = '';
  }

  statusLabel(status: StatusOrdem): string {
    return STATUS_LABELS[status];
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Erro ao ler foto.'));
      reader.readAsDataURL(file);
    });
  }
}
