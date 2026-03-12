import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Operacao, OrdemProducao, TipoOperacao } from '../ordem-servico.model';
import { OrdensServicoService } from '../ordens-servico.service';

const TIPOS_OPERACAO: TipoOperacao[] = [
  '1ª OPERAÇÃO', '2ª OPERAÇÃO', '3ª OPERAÇÃO', '4ª OPERAÇÃO', '5ª OPERAÇÃO', 'COMPLETO'
];

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
  pdfBase64 = '';
  pdfNome = '';
  readonly tiposOperacao = TIPOS_OPERACAO;

  readonly form = this.fb.group({
    nomePeca: ['', Validators.required],
    material: ['', Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1)]],
    prazoEntrega: ['', Validators.required],
    cliente: [''],
    observacoes: [''],
    operacoes: this.fb.array([])
  });

  get operacoesArray(): FormArray { return this.form.get('operacoes') as FormArray; }
  get operacoesControls(): FormGroup[] { return this.operacoesArray.controls as FormGroup[]; }

  constructor() {
    this.ordemId = this.route.snapshot.paramMap.get('id');
    if (this.ordemId) {
      this.edicao = true;
      const ordem = this.service.getOrdens().find(o => o.id === this.ordemId);
      if (ordem) { this.carregarOrdem(ordem); }
    } else {
      this.adicionarOperacao(); // começa com 1 operação
    }
  }

  private criarOperacaoGroup(op?: Partial<Operacao>): FormGroup {
    const medicoes = this.fb.array(
      (op?.medicoes ?? [
        { label: 'Ponto 1', predefinido: '', encontrado: '' },
        { label: 'Ponto 2', predefinido: '', encontrado: '' },
        { label: 'Ponto 3', predefinido: '', encontrado: '' },
        { label: 'Ponto 4', predefinido: '', encontrado: '' }
      ]).map(m => this.fb.group({ label: [m.label], predefinido: [m.predefinido], encontrado: [m.encontrado] }))
    );
    return this.fb.group({
      tipoOperacao: [op?.tipoOperacao ?? '1ª OPERAÇÃO', Validators.required],
      medicoes
    });
  }

  getMedicoesArray(opGroup: AbstractControl): FormGroup[] {
    return ((opGroup as FormGroup).get('medicoes') as FormArray).controls as FormGroup[];
  }

  adicionarOperacao(): void {
    if (this.operacoesArray.length >= 5) return;
    this.operacoesArray.push(this.criarOperacaoGroup());
  }

  removerOperacao(i: number): void {
    this.operacoesArray.removeAt(i);
  }

  private carregarOrdem(ordem: OrdemProducao): void {
    this.form.patchValue({
      nomePeca: ordem.nomePeca,
      material: ordem.material,
      quantidade: ordem.quantidade,
      prazoEntrega: ordem.prazoEntrega,
      cliente: ordem.cliente ?? '',
      observacoes: ordem.observacoes ?? ''
    });
    this.imagens = [...ordem.imagens];
    this.pdfBase64 = ordem.pdfAutocad ?? '';
    this.pdfNome = ordem.pdfNome ?? '';
    this.operacoesArray.clear();
    for (const op of ordem.operacoes) {
      this.operacoesArray.push(this.criarOperacaoGroup(op));
    }
  }

  async onImagens(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const novos = await Promise.all(files.map(f => this.readFile(f)));
    this.imagens = [...this.imagens, ...novos];
  }

  removerImagem(i: number): void { this.imagens.splice(i, 1); }

  async onPdf(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.pdfBase64 = await this.readFile(file);
    this.pdfNome = file.name;
  }

  salvar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.getRawValue();

    const operacoes: Omit<Operacao, 'id'>[] = (raw.operacoes as {tipoOperacao: string; medicoes: {label:string;predefinido:string;encontrado:string}[]}[]).map((op, i) => ({
      numero: i + 1,
      tipoOperacao: op.tipoOperacao as TipoOperacao,
      medicoes: op.medicoes,
      pecasRefugadas: 0,
      status: 'pendente' as const
    }));

    if (this.ordemId && this.edicao) {
      const existente = this.service.getOrdens().find(o => o.id === this.ordemId);
      const ops: Operacao[] = operacoes.map((op, i) => {
        const existOp = existente?.operacoes[i];
        return existOp
          ? { ...existOp, tipoOperacao: op.tipoOperacao, medicoes: op.medicoes }
          : { ...op, id: `${Date.now()}-${i}` };
      });
      this.service.atualizar(this.ordemId, {
        nomePeca: raw.nomePeca ?? '',
        material: raw.material ?? '',
        quantidade: raw.quantidade ?? 1,
        prazoEntrega: raw.prazoEntrega ?? '',
        cliente: raw.cliente ?? undefined,
        observacoes: raw.observacoes ?? undefined,
        imagens: this.imagens,
        pdfAutocad: this.pdfBase64 || undefined,
        pdfNome: this.pdfNome || undefined,
        operacoes: ops
      });
      void this.router.navigate(['/admin/ordem', this.ordemId]);
      return;
    }

    const ops: Operacao[] = operacoes.map((op, i) => ({ ...op, id: `${Date.now()}-${i}` }));
    const nova = this.service.criar({
      nomePeca: raw.nomePeca ?? '',
      material: raw.material ?? '',
      quantidade: raw.quantidade ?? 1,
      prazoEntrega: raw.prazoEntrega ?? '',
      cliente: raw.cliente ?? undefined,
      observacoes: raw.observacoes ?? undefined,
      imagens: this.imagens,
      pdfAutocad: this.pdfBase64 || undefined,
      pdfNome: this.pdfNome || undefined,
      operacoes: ops,
      status: 'pendente'
    });
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

