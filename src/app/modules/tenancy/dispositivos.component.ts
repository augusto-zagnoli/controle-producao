import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { mensagemDeErro } from '../../core/http/mensagem-erro';
import { ToastService } from '../../shared/toast/toast.service';
import { Dispositivo, DispositivoCriado, TenancyService, TipoDispositivo } from './tenancy.service';
import { ESTILOS_TENANCY } from './tenancy.styles';

// Tablets de chão de fábrica e painéis de TV autorizados. A chave aparece uma única vez.
@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="pagina">
      <div class="cabecalho">
        <div>
          <h1>Dispositivos</h1>
          <p class="ajuda">Tablets registram apontamentos de produção; painéis exibem o dashboard da TV (somente leitura).
            No aparelho, abra a página de ativação e informe a chave.</p>
        </div>
      </div>

      <form class="card form" [formGroup]="form" (ngSubmit)="criar()">
        <div class="campo">
          <label for="nome">Nome</label>
          <input id="nome" formControlName="nome" placeholder="Ex.: Tablet Torno 1" maxlength="120"
                 [class.invalido]="form.controls.nome.invalid && form.controls.nome.touched" />
        </div>
        <div class="campo">
          <label for="tipo">Tipo</label>
          <select id="tipo" formControlName="tipo">
            <option value="Tablet">Tablet (apontamento)</option>
            <option value="Painel">Painel de TV</option>
          </select>
        </div>
        <button class="btn btn-primario" type="submit" [disabled]="salvando">Gerar chave</button>
      </form>

      @if (criado) {
        <div class="card chave">
          <strong>Chave do dispositivo "{{ criado.dispositivo.nome }}"</strong>
          <p class="ajuda">Copie agora: por segurança ela não será exibida novamente.</p>
          <code>{{ criado.chave }}</code>
          <div class="acoes" style="justify-content:flex-start">
            <button class="btn" type="button" (click)="copiar(criado.chave)">Copiar</button>
            <button class="btn" type="button" (click)="criado = null">Já copiei</button>
          </div>
        </div>
      }

      @if (erro) { <p class="erro">{{ erro }}</p> }

      <div class="card">
        @if (carregando) { <p class="vazio">Carregando...</p> }
        @else if (!dispositivos.length) { <p class="vazio">Nenhum dispositivo cadastrado.</p> }
        @else {
          <table>
            <thead>
              <tr><th>Nome</th><th>Tipo</th><th>Chave</th><th>Último acesso</th><th>Situação</th><th class="acoes-cel"></th></tr>
            </thead>
            <tbody>
              @for (d of dispositivos; track d.id) {
                <tr>
                  <td>{{ d.nome }}</td>
                  <td>{{ d.tipo === 'Tablet' ? 'Tablet' : 'Painel de TV' }}</td>
                  <td><code>{{ d.chavePrefixo }}…</code></td>
                  <td>{{ d.ultimoAcessoEm ? (d.ultimoAcessoEm | date:'dd/MM/yyyy HH:mm') : '—' }}</td>
                  <td><span class="tag" [class.inativa]="!d.ativo">{{ d.ativo ? 'Ativo' : 'Revogado' }}</span></td>
                  <td class="acoes-cel">
                    <div class="acoes">
                      @if (d.ativo) { <button class="btn btn-perigo" type="button" (click)="revogar(d)">Revogar</button> }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [ESTILOS_TENANCY, `
    .chave { border: 1px solid #fde68a; background: #fffbeb; display: grid; gap: 8px; }
    .chave code { display: block; padding: 10px; background: #fff; border: 1px dashed #d97706; border-radius: 6px; word-break: break-all; font-size: 14px; }
  `]
})
export class DispositivosComponent implements OnInit {
  private readonly service = inject(TenancyService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    tipo: ['Tablet' as TipoDispositivo, Validators.required]
  });

  dispositivos: Dispositivo[] = [];
  criado: DispositivoCriado | null = null;
  carregando = true;
  salvando = false;
  erro = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.service.listarDispositivos().subscribe({
      next: lista => { this.dispositivos = lista; this.carregando = false; },
      error: err => { this.erro = mensagemDeErro(err); this.carregando = false; }
    });
  }

  criar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    this.erro = '';
    const { nome, tipo } = this.form.getRawValue();
    this.service.criarDispositivo(nome, tipo).subscribe({
      next: res => {
        this.criado = res;
        this.salvando = false;
        this.form.reset({ nome: '', tipo: 'Tablet' });
        this.carregar();
      },
      error: err => { this.erro = mensagemDeErro(err); this.salvando = false; }
    });
  }

  revogar(d: Dispositivo): void {
    if (!confirm(`Revogar "${d.nome}"? O aparelho perde o acesso imediatamente e precisará de uma nova chave.`)) return;
    this.service.revogarDispositivo(d.id).subscribe({
      next: () => { this.toast.success('Dispositivo revogado.'); this.carregar(); },
      error: err => this.toast.error(mensagemDeErro(err))
    });
  }

  copiar(chave: string): void {
    navigator.clipboard?.writeText(chave).then(
      () => this.toast.success('Chave copiada.'),
      () => this.toast.error('Não foi possível copiar; selecione e copie manualmente.')
    );
  }
}
