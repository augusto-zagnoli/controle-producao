import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DispositivoService } from './dispositivo.service';
import { mensagemDeErro } from '../http/mensagem-erro';

// Ativação de tablet/painel com a chave gerada em Administrativo → Dispositivos.
// A chave fica guardada neste aparelho; revogar o dispositivo no admin corta o acesso.
@Component({
  selector: 'app-ativar-dispositivo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="acesso-page">
      <form class="acesso-card" [formGroup]="form" (ngSubmit)="ativar()">
        <h2>Ativar este dispositivo</h2>
        <p class="sub">Informe a chave gerada pelo administrador em <strong>Administrativo → Dispositivos</strong>.
          Use um dispositivo do tipo <strong>Tablet</strong> para apontamentos ou <strong>Painel</strong> para a TV.</p>

        <label for="chave">Chave do dispositivo</label>
        <input id="chave" formControlName="chave" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="zd_..." />

        @if (erro) { <p class="erro">{{ erro }}</p> }

        <button type="submit" [disabled]="ativando || form.invalid">{{ ativando ? 'Ativando...' : 'Ativar' }}</button>
        <a routerLink="/login" class="link">Entrar com usuário e senha</a>
      </form>
    </div>
  `,
  styles: [`
    .acesso-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 16px; }
    .acesso-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.08); padding: 32px; width: 100%; max-width: 480px; display: grid; gap: 12px; }
    h2 { margin: 0; color: #1f2937; }
    .sub { color: #6b7280; margin: 0; line-height: 1.4; }
    label { font-weight: 600; color: #374151; font-size: 14px; }
    input { padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: monospace; font-size: 15px; }
    button { padding: 12px; border: none; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; }
    button[disabled] { opacity: .6; cursor: default; }
    .erro { color: #b91c1c; background: #fef2f2; padding: 10px; border-radius: 6px; margin: 0; }
    .link { color: #2563eb; text-align: center; font-size: 14px; }
  `]
})
export class AtivarDispositivoComponent {
  private readonly dispositivo = inject(DispositivoService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({ chave: ['', [Validators.required, Validators.minLength(10)]] });
  ativando = false;
  erro = '';

  ativar(): void {
    if (this.form.invalid) return;
    this.ativando = true;
    this.erro = '';
    this.dispositivo.ativar(this.form.getRawValue().chave).subscribe({
      next: sessao => void this.router.navigate([sessao.papel === 'DispositivoTablet' ? '/producao' : '/dashboard']),
      error: err => {
        this.ativando = false;
        this.erro = mensagemDeErro(err, 'Chave inválida ou revogada.');
      }
    });
  }
}
