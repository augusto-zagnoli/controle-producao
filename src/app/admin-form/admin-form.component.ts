import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Funcionario } from '../models/funcionario.model';
import {
  Funcao,
  FUNCAO_LABELS,
  FUNCAO_LIST,
  OPERACAO_LABELS,
  OPERACAO_LIST,
  OrdemServico,
  Prioridade,
  PRIORIDADE_LABELS,
  PRIORIDADE_LIST,
  Setor,
  SETOR_LABELS,
  SETOR_LIST,
  TipoOperacao
} from '../models/ordem-servico.model';
import { FuncionariosService } from '../services/funcionarios.service';
import { OrdensService } from '../services/ordens.service';

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
  private readonly funcionariosService = inject(FuncionariosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  edicao = false;
  ordemId: number | null = null;
  ordemAtual: OrdemServico | null = null;
  salvando = false;
  erro = '';

  funcionarios: Funcionario[] = [];

  // Seleções visuais
  prioridadeSelecionada: Prioridade = 'Media';
  funcaoSelecionada: Funcao = 'Operador';
  setorSelecionado: Setor = 'Usinagem';
  operacoesSelecionadas: Set<TipoOperacao> = new Set();

  // Listas para templates
  readonly prioridades = PRIORIDADE_LIST;
  readonly funcoes = FUNCAO_LIST;
  readonly setores = SETOR_LIST;
  readonly operacoes = OPERACAO_LIST;
  readonly prioridadeLabels = PRIORIDADE_LABELS;
  readonly funcaoLabels = FUNCAO_LABELS;
  readonly setorLabels = SETOR_LABELS;
  readonly operacaoLabels = OPERACAO_LABELS;

  // Uploads pendentes
  imagensPendentes: File[] = [];
  documentosPendentes: File[] = [];
  imagensParaRemover: number[] = [];
  documentosParaRemover: number[] = [];

  readonly form = this.fb.nonNullable.group({
    nomeProduto: ['', Validators.required],
    descricao: [''],
    quantidade: [1, [Validators.required, Validators.min(0.001)]],
    unidade: [''],
    funcionarioId: [0],
    dataInicio: [''],
    prazoPrevisto: ['', Validators.required],
    observacoes: ['']
  });

  ngOnInit(): void {
    this.funcionariosService.listar(true).subscribe({
      next: lista => this.funcionarios = lista
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.edicao = true;
      this.ordemId = Number(idParam);
      this.service.obter(this.ordemId).subscribe({
        next: (o) => {
          this.ordemAtual = o;
          this.prioridadeSelecionada = o.prioridade;
          this.funcaoSelecionada = o.funcao;
          this.setorSelecionado = o.setor;
          this.operacoesSelecionadas = new Set(o.operacoes.map(op => op.tipo));
          this.form.patchValue({
            nomeProduto: o.nomeProduto,
            descricao: o.descricao ?? '',
            quantidade: o.quantidade,
            unidade: o.unidade ?? '',
            funcionarioId: o.funcionarioId,
            dataInicio: o.dataInicio ? o.dataInicio.substring(0, 10) : '',
            prazoPrevisto: o.prazoPrevisto ? o.prazoPrevisto.substring(0, 10) : '',
            observacoes: o.observacoes ?? ''
          });
        },
        error: () => (this.erro = 'Erro ao carregar ordem.')
      });
    }
  }

  selecionarPrioridade(p: Prioridade): void { this.prioridadeSelecionada = p; }
  selecionarFuncao(f: Funcao): void { this.funcaoSelecionada = f; }
  selecionarSetor(s: Setor): void { this.setorSelecionado = s; }

  toggleOperacao(op: TipoOperacao): void {
    if (this.operacoesSelecionadas.has(op)) {
      this.operacoesSelecionadas.delete(op);
    } else {
      this.operacoesSelecionadas.add(op);
    }
  }

  isOperacaoSelecionada(op: TipoOperacao): boolean {
    return this.operacoesSelecionadas.has(op);
  }

  onImagens(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imagensPendentes = [...this.imagensPendentes, ...Array.from(input.files ?? [])];
  }

  onDocumentos(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.documentosPendentes = [...this.documentosPendentes, ...Array.from(input.files ?? [])];
  }

  removerImagemExistente(id: number): void {
    this.imagensParaRemover.push(id);
    if (this.ordemAtual) {
      this.ordemAtual = { ...this.ordemAtual, imagens: this.ordemAtual.imagens.filter(i => i.id !== id) };
    }
  }

  removerDocumentoExistente(id: number): void {
    this.documentosParaRemover.push(id);
    if (this.ordemAtual) {
      this.ordemAtual = { ...this.ordemAtual, documentos: this.ordemAtual.documentos.filter(d => d.id !== id) };
    }
  }

  removerImagemPendente(i: number): void { this.imagensPendentes.splice(i, 1); }
  removerDocumentoPendente(i: number): void { this.documentosPendentes.splice(i, 1); }

  salvar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    this.erro = '';

    const { nomeProduto, descricao, quantidade, unidade, funcionarioId, dataInicio, prazoPrevisto, observacoes } =
      this.form.getRawValue();

    const dto = {
      nomeProduto,
      descricao: descricao || null,
      quantidade,
      unidade: unidade || null,
      prioridade: this.prioridadeSelecionada,
      funcionarioId: Number(funcionarioId),
      funcao: this.funcaoSelecionada,
      setor: this.setorSelecionado,
      operacoes: Array.from(this.operacoesSelecionadas),
      dataInicio: dataInicio || null,
      prazoPrevisto,
      observacoes: observacoes || null
    };

    const salvarDados$ = this.edicao && this.ordemId
      ? this.service.atualizar(this.ordemId, dto)
      : this.service.criar(dto);

    salvarDados$.pipe(
      switchMap((ordem) => {
        const ops: Observable<unknown>[] = [];
        for (const imgId of this.imagensParaRemover) ops.push(this.service.removerImagem(ordem.id, imgId));
        for (const docId of this.documentosParaRemover) ops.push(this.service.removerDocumento(ordem.id, docId));
        for (const f of this.imagensPendentes) ops.push(this.service.adicionarImagem(ordem.id, f));
        for (const f of this.documentosPendentes) ops.push(this.service.adicionarDocumento(ordem.id, f));
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
