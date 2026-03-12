import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrdemServicoPayload, PrioridadeOrdem, StatusOrdem } from '../ordem-servico.model';
import { OrdensServicoService } from '../ordens-servico.service';

@Component({
  selector: 'app-admin-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-form.component.html',
  styleUrl: './admin-form.component.scss'
})
export class AdminFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrdensServicoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  edicao = false;
  ordemId: string | null = null;
  imagens: string[] = [];
  pdfAutocad = '';
  pdfNomeArquivo = '';

  readonly form = this.fb.nonNullable.group({
    descricao: ['', [Validators.required]],
    cliente: ['', [Validators.required]],
    prioridade: ['media' as string, [Validators.required]],
    material: ['', [Validators.required]],
    medidas: ['', [Validators.required]],
    observacoes: [''],
    status: ['pendente' as string, [Validators.required]]
  });

  constructor() {
    this.ordemId = this.route.snapshot.paramMap.get('id');
    if (!this.ordemId) {
      return;
    }
    this.edicao = true;
    this.service.getById(this.ordemId).subscribe((ordem) => {
      if (!ordem) {
        return;
      }
      this.form.patchValue({
        descricao: ordem.descricao,
        cliente: ordem.cliente,
        prioridade: ordem.prioridade,
        material: ordem.material,
        medidas: ordem.medidas,
        observacoes: ordem.observacoes,
        status: ordem.status
      });
      this.imagens = ordem.imagens;
      this.pdfAutocad = ordem.pdfAutocad;
      this.pdfNomeArquivo = ordem.pdfNomeArquivo;
    });
  }

  async onImagens(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.imagens = await Promise.all(files.map((file) => this.readFile(file)));
  }

  async onPdf(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.pdfAutocad = await this.readFile(file);
    this.pdfNomeArquivo = file.name;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: OrdemServicoPayload = {
      descricao: raw.descricao,
      cliente: raw.cliente,
      prioridade: raw.prioridade as PrioridadeOrdem,
      status: raw.status as StatusOrdem,
      material: raw.material,
      medidas: raw.medidas,
      observacoes: raw.observacoes,
      imagens: this.imagens,
      pdfAutocad: this.pdfAutocad,
      pdfNomeArquivo: this.pdfNomeArquivo
    };
    if (this.ordemId) {
      this.service.atualizar(this.ordemId, payload);
      void this.router.navigate(['/admin/ordem', this.ordemId]);
      return;
    }
    const nova = this.service.criar(payload);
    void this.router.navigate(['/admin/ordem', nova.id]);
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  }
}
