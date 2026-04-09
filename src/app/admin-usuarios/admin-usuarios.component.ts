import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PerfilUsuario, Usuario } from '../models/funcionario.model';
import { UsuariosService } from '../services/usuarios.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.scss'
})
export class AdminUsuariosComponent implements OnInit {
  private readonly service = inject(UsuariosService);
  private readonly fb = inject(FormBuilder);

  usuarios: Usuario[] = [];
  carregando = false;
  erro = '';
  salvando = false;
  erroForm = '';

  editandoId: number | null = null;
  mostrarForm = false;

  readonly perfis: PerfilUsuario[] = ['Administrador', 'TecnicoCnc'];
  readonly perfilLabels: Record<PerfilUsuario, string> = {
    Administrador: 'Administrador',
    TecnicoCnc: 'Técnico CNC'
  };

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    login: ['', [Validators.required, Validators.minLength(3)]],
    senha: [''],
    perfil: ['TecnicoCnc' as PerfilUsuario, Validators.required]
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.service.listar().subscribe({
      next: lista => { this.usuarios = lista; this.carregando = false; },
      error: () => { this.erro = 'Erro ao carregar usuários.'; this.carregando = false; }
    });
  }

  abrirNovo(): void {
    this.editandoId = null;
    this.form.reset({ nome: '', login: '', senha: '', perfil: 'TecnicoCnc' });
    this.form.get('senha')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('senha')!.updateValueAndValidity();
    this.erroForm = '';
    this.mostrarForm = true;
  }

  abrirEdicao(u: Usuario): void {
    this.editandoId = u.id;
    this.form.reset({ nome: u.nome, login: u.login, senha: '', perfil: u.perfil as PerfilUsuario });
    this.form.get('senha')!.clearValidators();
    this.form.get('senha')!.updateValueAndValidity();
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
    const v = this.form.value as { nome: string; login: string; senha: string; perfil: PerfilUsuario };

    const req = this.editandoId
      ? this.service.atualizar(this.editandoId, { nome: v.nome, login: v.login, senha: v.senha || undefined, perfil: v.perfil })
      : this.service.criar({ nome: v.nome, login: v.login, senha: v.senha, perfil: v.perfil });

    req.subscribe({
      next: () => { this.mostrarForm = false; this.editandoId = null; this.salvando = false; this.carregar(); },
      error: () => { this.erroForm = 'Erro ao salvar. Login pode já estar em uso.'; this.salvando = false; }
    });
  }

  excluir(u: Usuario): void {
    if (!confirm(`Excluir o usuário "${u.nome}"?`)) return;
    this.service.excluir(u.id).subscribe({
      next: () => this.carregar(),
      error: () => alert('Erro ao excluir.')
    });
  }
}
