import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrdemServico } from '../models/ordem-servico.model';
import { OrdensService } from '../services/ordens.service';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-form.component.html',
  styleUrl: './admin-form.component.scss'
})
export class AdminFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(OrdensService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  edicao = false;
  ordemId: number | null = null;
  ordemAtual: OrdemServico | null = null;
  salvando = false;
  erro = '';

  // Uploads pendentes (novos arquivos selecionados)
  imagensPendentes: File[] = [];
  documentosPendentes: File[] = [];

  // RemoÃ§Ãµes pendentes
  imagensParaRemover: number[] = [];
  documentosParaRemover: number[] = [];

  readonly form = this.fb.nonNullable.group({
    descricaoPeca: ['', Validators.required],
    material: ['', Validators.required],
    medidas: [''],
    quantidade: [1, [Validators.required, Validators.min(1)]],
    observacoes: ['']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.edicao = true;
      this.ordemId = Number(idParam);
      this.service.obter(this.ordemId).subscribe({
        next: (o) => {
          this.ordemAtual = o;
          this.form.patchValue({
            descricaoPeca: o.descricaoPeca,
            material: o.material,
            medidas: o.medidas ?? '',
            quantidade: o.quantidade,
            observacoes: o.observacoes ?? ''
          });
        },
        error: () => this.erro = 'Erro ao carregar ordem.'
      });
    }
  }

  onImagens(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.imagensPendentes = [...this.imagensPendentes, ...files];
  }

  onDocumentos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.documentosPendentes = [...this.documentosPendentes, ...files];
  }

  removerImagemExistente(id: number): void {
    this.imagensParaRemover.push(id);
    if (this.ordemAtual) {
      this.ordemAtual = {
        ...this.ordemAtual,
        imagens: this.ordemAtual.imagens.filter(i => i.id !== id)
      };
    }
  }

  removerDocumentoExistente(id: number): void {
    this.documentosParaRemover.push(id);
    if (this.ordemAtual) {
      this.ordemAtual = {
        ...this.ordemAtual,
        documentos: this.ordemAtual.documentos.filter(d => d.id !== id)
      };
    }
  }

  removerImagemPendente(i: number): void {
    this.imagensPendentes.splice(i, 1);
  }

  removerDocumentoPendente(i: number): void {
    this.documentosPendentes.splice(i, 1);
  }

  salvar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    this.erro = '';

    const { descricaoPeca, material, medidas, quantidade, observacoes } = this.form.getRawValue();
    const dto = {
      descricaoPeca,
      material,
      medidas: medidas || null,
      quantidade,
      observacoes: observacoes || null
    };

    const salvarDados$ = this.edicao && this.ordemId
      ? this.service.atualizar(this.ordemId, dto)
      : this.service.criar(dto);

    salvarDados$.pipe(
      switchMap((ordem) => {
        const ops: Observable<unknown>[] = [];

        // Remover imagens marcadas
        for (const imgId of this.imagensParaRemover) {
          ops.push(this.service.removerImagem(ordem.id, imgId));
        }
        // Remover documentos marcados
        for (const docId of this.documentosParaRemover) {
          ops.push(this.service.removerDocumento(ordem.id, docId));
        }
        // Upload de novas imagens
        for (const f of this.imagensPendentes) {
          ops.push(this.service.adicionarImagem(ordem.id, f));
        }
        // Upload de novos documentos
        for (const f of this.documentosPendentes) {
          ops.push(this.service.adicionarDocumento(ordem.id, f));
        }

        return ops.length > 0 ? forkJoin(ops).pipe(switchMap(() => of(ordem))) : of(ordem);
      })
    ).subscribe({
      next: (ordem) => {
        this.salvando = false;
        void this.router.navigate(['/admin/ordem', ordem.id]);
      },
      error: () => {
        this.salvando = false;
        this.erro = 'Erro ao salvar. Verifique os dados e tente novamente.';
      }
    });
  }
}

