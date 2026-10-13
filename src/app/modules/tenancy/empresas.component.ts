import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensagemDeErro } from '../../core/http/mensagem-erro';
import { ToastService } from '../../shared/toast/toast.service';
import { Empresa, Filial, TenancyService } from './tenancy.service';
import { ESTILOS_TENANCY } from './tenancy.styles';

// Empresas (CNPJ) e filiais do tenant. Base para os escopos da Central de Parâmetros
// e, futuramente, para os módulos fiscal e financeiro.
@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="pagina">
      <div class="cabecalho">
        <div>
          <h1>Empresas e filiais</h1>
          <p class="ajuda">Pessoas jurídicas da sua organização. O CNPJ aceita o formato numérico e o alfanumérico.</p>
        </div>
        @if (!empresaForm.visivel) { <button class="btn btn-primario" type="button" (click)="novaEmpresa()">Nova empresa</button> }
      </div>

      @if (empresaForm.visivel) {
        <form class="card" [formGroup]="fEmpresa" (ngSubmit)="salvarEmpresa()">
          <h3>{{ empresaForm.id ? 'Editar empresa' : 'Nova empresa' }}</h3>
          <div class="form">
            <div class="campo"><label>Razão social *</label><input formControlName="razaoSocial" maxlength="200" [class.invalido]="invalido(fEmpresa, 'razaoSocial')" /></div>
            <div class="campo"><label>Nome fantasia</label><input formControlName="nomeFantasia" maxlength="200" /></div>
            <div class="campo"><label>CNPJ *</label><input formControlName="cnpj" maxlength="18" placeholder="00.000.000/0000-00" [class.invalido]="invalido(fEmpresa, 'cnpj')" /></div>
            <div class="campo"><label>Inscrição estadual</label><input formControlName="inscricaoEstadual" maxlength="30" /></div>
            <label class="check"><input type="checkbox" formControlName="ativa" /> Ativa</label>
          </div>
          <div class="acoes" style="margin-top:12px">
            <button class="btn" type="button" (click)="empresaForm = { visivel: false, id: null }">Cancelar</button>
            <button class="btn btn-primario" type="submit" [disabled]="salvando">Salvar</button>
          </div>
        </form>
      }

      @if (filialForm.visivel) {
        <form class="card" [formGroup]="fFilial" (ngSubmit)="salvarFilial()">
          <h3>{{ filialForm.id ? 'Editar filial' : 'Nova filial' }} — {{ nomeEmpresa(fFilial.controls.empresaId.value) }}</h3>
          <div class="form">
            <div class="campo"><label>Nome *</label><input formControlName="nome" maxlength="200" [class.invalido]="invalido(fFilial, 'nome')" /></div>
            <div class="campo"><label>Código</label><input formControlName="codigo" maxlength="30" /></div>
            <div class="campo"><label>CNPJ</label><input formControlName="cnpj" maxlength="18" /></div>
            <div class="campo"><label>Cidade</label><input formControlName="cidade" maxlength="120" /></div>
            <div class="campo"><label>UF</label><input formControlName="uf" maxlength="2" style="text-transform:uppercase" /></div>
            <label class="check"><input type="checkbox" formControlName="ativa" /> Ativa</label>
          </div>
          <div class="acoes" style="margin-top:12px">
            <button class="btn" type="button" (click)="filialForm = { visivel: false, id: null }">Cancelar</button>
            <button class="btn btn-primario" type="submit" [disabled]="salvando">Salvar</button>
          </div>
        </form>
      }

      @if (erro) { <p class="erro">{{ erro }}</p> }

      @if (carregando) { <p class="vazio">Carregando...</p> }
      @else if (!empresas.length) { <div class="card"><p class="vazio">Nenhuma empresa cadastrada.</p></div> }

      @for (e of empresas; track e.id) {
        <div class="card">
          <div class="cabecalho" style="margin-bottom:8px">
            <div>
              <strong>{{ e.razaoSocial }}</strong> @if (e.nomeFantasia) { <span class="ajuda">({{ e.nomeFantasia }})</span> }
              <div class="ajuda">CNPJ {{ e.cnpjFormatado }} · <span class="tag" [class.inativa]="!e.ativa">{{ e.ativa ? 'Ativa' : 'Inativa' }}</span></div>
            </div>
            <div class="acoes">
              <button class="btn" type="button" (click)="novaFilial(e)">Nova filial</button>
              <button class="btn" type="button" (click)="editarEmpresa(e)">Editar</button>
              <button class="btn btn-perigo" type="button" (click)="excluirEmpresa(e)">Excluir</button>
            </div>
          </div>
          @if (e.filiais.length) {
            <table class="sub-tabela">
              <thead><tr><th>Filial</th><th>Código</th><th>Cidade/UF</th><th>Situação</th><th class="acoes-cel"></th></tr></thead>
              <tbody>
                @for (f of e.filiais; track f.id) {
                  <tr>
                    <td>{{ f.nome }}</td>
                    <td>{{ f.codigo || '—' }}</td>
                    <td>{{ f.cidade || '—' }}{{ f.uf ? '/' + f.uf : '' }}</td>
                    <td><span class="tag" [class.inativa]="!f.ativa">{{ f.ativa ? 'Ativa' : 'Inativa' }}</span></td>
                    <td class="acoes-cel"><div class="acoes">
                      <button class="btn" type="button" (click)="editarFilial(f)">Editar</button>
                      <button class="btn btn-perigo" type="button" (click)="excluirFilial(f)">Excluir</button>
                    </div></td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="vazio">Sem filiais.</p> }
        </div>
      }
    </div>
  `,
  styles: [ESTILOS_TENANCY, `h3 { margin: 0 0 12px; font-size: 16px; }`]
})
export class EmpresasComponent implements OnInit {
  private readonly service = inject(TenancyService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  empresas: Empresa[] = [];
  carregando = true;
  salvando = false;
  erro = '';
  empresaForm: { visivel: boolean; id: number | null } = { visivel: false, id: null };
  filialForm: { visivel: boolean; id: number | null } = { visivel: false, id: null };

  readonly fEmpresa = this.fb.nonNullable.group({
    razaoSocial: ['', [Validators.required, Validators.maxLength(200)]],
    nomeFantasia: [''],
    cnpj: ['', [Validators.required, Validators.minLength(14)]],
    inscricaoEstadual: [''],
    ativa: [true]
  });

  readonly fFilial = this.fb.nonNullable.group({
    empresaId: [0],
    nome: ['', [Validators.required, Validators.maxLength(200)]],
    codigo: [''],
    cnpj: [''],
    cidade: [''],
    uf: [''],
    ativa: [true]
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.service.listarEmpresas().subscribe({
      next: lista => { this.empresas = lista; this.carregando = false; },
      error: err => { this.erro = mensagemDeErro(err); this.carregando = false; }
    });
  }

  invalido(form: { controls: Record<string, { invalid: boolean; touched: boolean }> }, campo: string): boolean {
    const c = form.controls[campo];
    return c.invalid && c.touched;
  }

  nomeEmpresa(id: number): string {
    return this.empresas.find(e => e.id === id)?.razaoSocial ?? '';
  }

  novaEmpresa(): void {
    this.fEmpresa.reset({ razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '', ativa: true });
    this.empresaForm = { visivel: true, id: null };
  }

  editarEmpresa(e: Empresa): void {
    this.fEmpresa.reset({ razaoSocial: e.razaoSocial, nomeFantasia: e.nomeFantasia ?? '', cnpj: e.cnpjFormatado,
      inscricaoEstadual: e.inscricaoEstadual ?? '', ativa: e.ativa });
    this.empresaForm = { visivel: true, id: e.id };
  }

  salvarEmpresa(): void {
    if (this.fEmpresa.invalid) { this.fEmpresa.markAllAsTouched(); return; }
    const v = this.fEmpresa.getRawValue();
    const req = { ...v, nomeFantasia: v.nomeFantasia || null, inscricaoEstadual: v.inscricaoEstadual || null };
    const id = this.empresaForm.id;
    this.executar(id ? this.service.atualizarEmpresa(id, req) : this.service.criarEmpresa(req), 'Empresa salva.',
      () => (this.empresaForm = { visivel: false, id: null }));
  }

  excluirEmpresa(e: Empresa): void {
    if (!confirm(`Excluir a empresa "${e.razaoSocial}" e suas filiais?`)) return;
    this.executar(this.service.excluirEmpresa(e.id), 'Empresa excluída.');
  }

  novaFilial(e: Empresa): void {
    this.fFilial.reset({ empresaId: e.id, nome: '', codigo: '', cnpj: '', cidade: '', uf: '', ativa: true });
    this.filialForm = { visivel: true, id: null };
  }

  editarFilial(f: Filial): void {
    this.fFilial.reset({ empresaId: f.empresaId, nome: f.nome, codigo: f.codigo ?? '', cnpj: f.cnpj ?? '',
      cidade: f.cidade ?? '', uf: f.uf ?? '', ativa: f.ativa });
    this.filialForm = { visivel: true, id: f.id };
  }

  salvarFilial(): void {
    if (this.fFilial.invalid) { this.fFilial.markAllAsTouched(); return; }
    const v = this.fFilial.getRawValue();
    const req = { ...v, codigo: v.codigo || null, cnpj: v.cnpj || null, cidade: v.cidade || null, uf: v.uf ? v.uf.toUpperCase() : null };
    const id = this.filialForm.id;
    this.executar(id ? this.service.atualizarFilial(id, req) : this.service.criarFilial(req), 'Filial salva.',
      () => (this.filialForm = { visivel: false, id: null }));
  }

  excluirFilial(f: Filial): void {
    if (!confirm(`Excluir a filial "${f.nome}"?`)) return;
    this.executar(this.service.excluirFilial(f.id), 'Filial excluída.');
  }

  private executar(acao: import('rxjs').Observable<unknown>, sucesso: string, aoConcluir?: () => void): void {
    this.salvando = true;
    this.erro = '';
    acao.subscribe({
      next: () => {
        this.salvando = false;
        this.toast.success(sucesso);
        aoConcluir?.();
        this.carregar();
      },
      error: err => {
        this.salvando = false;
        this.erro = mensagemDeErro(err);
      }
    });
  }
}
