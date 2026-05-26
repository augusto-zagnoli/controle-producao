import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OpcaoCampo } from '../models/ordem-servico.model';
import { OpcoesService } from '../services/opcoes.service';

@Component({
  selector: 'app-admin-opcoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-opcoes.component.html',
  styleUrl: './admin-opcoes.component.scss'
})
export class AdminOpcoesComponent implements OnInit {
  private readonly service = inject(OpcoesService);

  funcoes: OpcaoCampo[] = [];
  setores: OpcaoCampo[] = [];
  operacoes: OpcaoCampo[] = [];
  equipamentos: OpcaoCampo[] = [];
  carregando = false;

  // Novo item
  novoTipo: 'Funcao' | 'Setor' | 'Operacao' | 'Equipamento' = 'Funcao';
  novoNome = '';
  novaOrdem = 0;
  salvandoNovo = false;
  erroNovo = '';

  // Edição inline
  editandoId: number | null = null;
  editNome = '';
  editOrdem = 0;
  editAtivo = true;
  salvandoEdit = false;

  erro = '';
  sucesso = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.service.listar().subscribe({
      next: lista => {
        this.funcoes      = lista.filter(o => o.tipo === 'Funcao');
        this.setores      = lista.filter(o => o.tipo === 'Setor');
        this.operacoes    = lista.filter(o => o.tipo === 'Operacao');
        this.equipamentos = lista.filter(o => o.tipo === 'Equipamento');
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar opções.';
        this.carregando = false;
      }
    });
  }

  adicionar(): void {
    if (!this.novoNome.trim()) { this.erroNovo = 'Nome é obrigatório.'; return; }
    this.salvandoNovo = true;
    this.erroNovo = '';
    this.service.criar({ tipo: this.novoTipo, nome: this.novoNome.trim(), ordem: this.novaOrdem }).subscribe({
      next: () => {
        this.novoNome = '';
        this.novaOrdem = 0;
        this.salvandoNovo = false;
        this.mostrarSucesso('Opção adicionada.');
        this.carregar();
      },
      error: () => {
        this.erroNovo = 'Erro ao adicionar.';
        this.salvandoNovo = false;
      }
    });
  }

  iniciarEdicao(o: OpcaoCampo): void {
    this.editandoId = o.id;
    this.editNome = o.nome;
    this.editOrdem = o.ordem;
    this.editAtivo = o.ativo;
  }

  cancelarEdicao(): void {
    this.editandoId = null;
  }

  salvarEdicao(): void {
    if (!this.editandoId) return;
    this.salvandoEdit = true;
    this.service.atualizar(this.editandoId, { nome: this.editNome, ordem: this.editOrdem, ativo: this.editAtivo }).subscribe({
      next: () => {
        this.editandoId = null;
        this.salvandoEdit = false;
        this.mostrarSucesso('Salvo com sucesso.');
        this.carregar();
      },
      error: () => {
        this.salvandoEdit = false;
      }
    });
  }

  excluir(id: number): void {
    if (!confirm('Excluir esta opção?')) return;
    this.service.excluir(id).subscribe({
      next: () => { this.mostrarSucesso('Opção excluída.'); this.carregar(); },
      error: () => { this.erro = 'Erro ao excluir.'; }
    });
  }

  private mostrarSucesso(msg: string): void {
    this.sucesso = msg;
    setTimeout(() => this.sucesso = '', 3000);
  }
}
