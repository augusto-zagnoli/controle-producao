import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Operacao, OrdemProducao, STATUS_OP_LABELS } from '../ordem-servico.model';
import { OrdensServicoService } from '../ordens-servico.service';

interface ApontamentoForm {
  operador: string;
  programador: string;
  maquina: string;
  quantidade: number;
  pecasRefugadas: number;
  observacoes: string;
  horarioConclusao: string;
  medicoes: { label: string; predefinido: string; encontrado: string }[];
  foto: string;
}

@Component({
  selector: 'app-producao-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producao-detail.component.html',
  styleUrl: './producao-detail.component.scss'
})
export class ProducaoDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensServicoService);
  private readonly destroyRef = inject(DestroyRef);

  ordem: OrdemProducao | undefined;
  operacaoAtiva: Operacao | null = null;
  apontamentoForm: ApontamentoForm | null = null;
  acao: 'iniciar' | 'concluir' | null = null;
  salvando = false;

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.service.getById(params.get('id') ?? '')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((ordem) => {
        this.ordem = ordem;
      });
  }

  abrirIniciar(op: Operacao): void {
    this.operacaoAtiva = op;
    this.acao = 'iniciar';
    this.apontamentoForm = {
      operador: '',
      programador: op.programador ?? '',
      maquina: op.maquina ?? '',
      quantidade: this.ordem?.quantidade ?? 1,
      pecasRefugadas: 0,
      observacoes: '',
      horarioConclusao: '',
      medicoes: op.medicoes.map(m => ({ ...m })),
      foto: ''
    };
  }

  abrirConcluir(op: Operacao): void {
    this.operacaoAtiva = op;
    this.acao = 'concluir';
    this.apontamentoForm = {
      operador: op.operador ?? '',
      programador: op.programador ?? '',
      maquina: op.maquina ?? '',
      quantidade: op.quantidade ?? this.ordem?.quantidade ?? 1,
      pecasRefugadas: op.pecasRefugadas,
      observacoes: op.observacoes ?? '',
      horarioConclusao: '',
      medicoes: op.medicoes.map(m => ({ ...m })),
      foto: ''
    };
  }

  cancelar(): void {
    this.operacaoAtiva = null;
    this.apontamentoForm = null;
    this.acao = null;
  }

  async onFoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.apontamentoForm) return;
    this.apontamentoForm.foto = await this.readFile(file);
  }

  confirmar(): void {
    if (!this.ordem || !this.operacaoAtiva || !this.apontamentoForm) return;
    if (!this.apontamentoForm.foto) {
      alert('⚠️ É obrigatório tirar uma foto do responsável pela alteração.');
      return;
    }
    if (!this.apontamentoForm.operador.trim()) {
      alert('⚠️ Informe o nome do operador.');
      return;
    }

    this.salvando = true;
    const agora = new Date();
    const horaStr = agora.toTimeString().substring(0, 5);
    const dataStr = agora.toISOString().substring(0, 10);

    const opAtualizada: Operacao = {
      ...this.operacaoAtiva,
      operador: this.apontamentoForm.operador,
      programador: this.apontamentoForm.programador,
      maquina: this.apontamentoForm.maquina,
      quantidade: this.apontamentoForm.quantidade,
      pecasRefugadas: this.apontamentoForm.pecasRefugadas,
      observacoes: this.apontamentoForm.observacoes,
      medicoes: this.apontamentoForm.medicoes,
      fotoResponsavel: this.apontamentoForm.foto,
      status: this.acao === 'iniciar' ? 'em_andamento' : 'concluida',
      dataHoraInicial: this.acao === 'iniciar' ? agora.toISOString() : this.operacaoAtiva.dataHoraInicial,
      dataHoraFinal: this.acao === 'concluir' ? agora.toISOString() : undefined
    };

    this.service.atualizarOperacao(this.ordem.id, opAtualizada);

    if (this.acao === 'concluir') {
      this.service.registrarApontamento({
        ordemId: this.ordem.id,
        numeroOP: this.ordem.numeroOP,
        nomePeca: this.ordem.nomePeca,
        operador: this.apontamentoForm.operador,
        programador: this.apontamentoForm.programador,
        maquina: this.apontamentoForm.maquina,
        quantidade: this.apontamentoForm.quantidade,
        tipoOperacao: this.operacaoAtiva.tipoOperacao,
        data: dataStr,
        horario: horaStr,
        quantidadeRefugada: this.apontamentoForm.pecasRefugadas,
        horarioConclusao: this.apontamentoForm.horarioConclusao || horaStr,
        foto: this.apontamentoForm.foto
      });
    }

    this.cancelar();
    this.salvando = false;
  }

  statusOPLabel(s: OrdemProducao['status']): string { return STATUS_OP_LABELS[s]; }

  formatarData(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  formatarDataHora(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR');
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Erro ao ler foto.'));
      reader.readAsDataURL(file);
    });
  }
}

