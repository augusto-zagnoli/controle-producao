import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Funcionario } from '../models/funcionario.model';
import { Funcao, FUNCAO_LABELS, FUNCAO_LIST, Setor, SETOR_LABELS, SETOR_LIST } from '../models/ordem-servico.model';
import { FuncionariosService } from '../services/funcionarios.service';

@Component({
  selector: 'app-admin-funcionarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-funcionarios.component.html',
  styleUrl: './admin-funcionarios.component.scss'
})
export class AdminFuncionariosComponent implements OnInit {
  private readonly service = inject(FuncionariosService);
  private readonly fb = inject(FormBuilder);

  funcionarios: Funcionario[] = [];
  carregando = false;
  erro = '';
  salvando = false;
  erroForm = '';

  editandoId: number | null = null;
  mostrarForm = false;

  readonly funcaoList = FUNCAO_LIST;
  readonly setorList = SETOR_LIST;
  readonly funcaoLabels = FUNCAO_LABELS;
  readonly setorLabels = SETOR_LABELS;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    funcao: ['Operador' as Funcao, Validators.required],
    setor: ['Usinagem' as Setor, Validators.required]
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.service.listar().subscribe({
      next: lista => { this.funcionarios = lista; this.carregando = false; },
      error: () => { this.erro = 'Erro ao carregar funcionários.'; this.carregando = false; }
    });
  }

  abrirNovo(): void {
    this.editandoId = null;
    this.form.reset({ nome: '', funcao: 'Operador', setor: 'Usinagem' });
    this.erroForm = '';
    this.mostrarForm = true;
  }

  abrirEdicao(f: Funcionario): void {
    this.editandoId = f.id;
    this.form.reset({ nome: f.nome, funcao: f.funcao, setor: f.setor });
    this.erroForm = '';
    this.mostrarForm = true;
  }

  cancelar(): void {
    this.mostrarForm = false;
    this.editandoId = null;
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando = true;
    this.erroForm = '';

    const dto = this.form.value as { nome: string; funcao: Funcao; setor: Setor };

    const req = this.editandoId
      ? this.service.atualizar(this.editandoId, dto)
      : this.service.criar(dto);

    req.subscribe({
      next: () => { this.mostrarForm = false; this.editandoId = null; this.salvando = false; this.carregar(); },
      error: () => { this.erroForm = 'Erro ao salvar. Tente novamente.'; this.salvando = false; }
    });
  }

  alternarAtivo(f: Funcionario): void {
    this.service.alternarAtivo(f.id).subscribe({ next: () => this.carregar() });
  }

  excluir(f: Funcionario): void {
    if (!confirm(`Excluir o funcionário "${f.nome}"?`)) return;
    this.service.excluir(f.id).subscribe({
      next: () => this.carregar(),
      error: () => alert('Erro ao excluir. O funcionário pode estar vinculado a ordens de serviço.')
    });
  }
}
