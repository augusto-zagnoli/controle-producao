import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { OrdemServico, STATUS_LABELS, OrdemServicoStatus, Funcao, Setor } from '../../models/ordem-servico.model';
import { Funcionario } from '../../models/funcionario.model';
import { OrdensService } from '../../services/ordens.service';
import { FuncionariosService } from '../../services/funcionarios.service';
import { OpcoesService } from '../../services/opcoes.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-producao-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producao-detail.component.html',
  styleUrl: './producao-detail.component.scss'
})
export class ProducaoDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensService);
  private readonly funcionariosService = inject(FuncionariosService);
  private readonly opcoesService = inject(OpcoesService);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  ordem: OrdemServico | null = null;
  carregando = true;
  erro = '';

  modalAberto = false;
  novoStatus: OrdemServicoStatus = 'EmProducao';
  observacao = '';
  fotoOperador: File | null = null;
  fotoPreview: string | null = null;
  salvando = false;
  erroModal = '';

  cameraAtiva = false;
  iniciandoCamera = false;
  private stream: MediaStream | null = null;

  funcionarios: Funcionario[] = [];
  funcionarioSelecionadoId: number = 0;

  readonly statusOptions: { value: OrdemServicoStatus; label: string }[] = [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'EmProducao', label: 'Em Producao' },
    { value: 'Pausada', label: 'Pausada' },
    { value: 'Finalizada', label: 'Finalizada' },
  ];

  funcaoOptions: string[] = [];
  setorOptions: string[] = [];

  // Edição função/setor
  editandoFuncaoSetor = false;
  funcaoEdit: Funcao = 'Operador';
  setorEdit: Setor = 'Usinagem';
  funcionarioFuncaoSetorId = 0;
  salvandoFuncaoSetor = false;
  erroFuncaoSetor = '';

  ngOnInit(): void {
    this.funcionariosService.listar(true).subscribe({ next: lista => { this.funcionarios = lista; } });
    this.opcoesService.listar().subscribe({
      next: lista => {
        this.funcaoOptions = lista.filter(o => o.tipo === 'Funcao' && o.ativo && o.nome).map(o => o.nome);
        this.setorOptions  = lista.filter(o => o.tipo === 'Setor'  && o.ativo && o.nome).map(o => o.nome);
      }
    });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregando = true;
    this.service.obter(id).subscribe({
      next: ordem => {
        this.ordem = ordem;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar a ordem de servico.';
        this.carregando = false;
      }
    });
  }

  abrirModal(): void {
    if (!this.ordem) return;
    this.novoStatus = this.ordem.status;
    this.observacao = '';
    this.fotoOperador = null;
    this.fotoPreview = null;
    this.erroModal = '';
    this.funcionarioSelecionadoId = 0;
    this.modalAberto = true;
    setTimeout(() => this.iniciarCamera(), 0);
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.pararCamera();
  }

  ngOnDestroy(): void {
    this.pararCamera();
  }

  async iniciarCamera(): Promise<void> {
    if (this.cameraAtiva || this.iniciandoCamera) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.erroModal = 'Câmera não disponível neste dispositivo/navegador.';
      return;
    }
    this.iniciandoCamera = true;
    this.erroModal = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      this.cameraAtiva = true;
      // aguarda o @if renderizar o <video>
      setTimeout(() => {
        if (this.videoEl?.nativeElement && this.stream) {
          this.videoEl.nativeElement.srcObject = this.stream;
          this.videoEl.nativeElement.play().catch(() => { /* ignore */ });
        }
      }, 0);
    } catch {
      this.erroModal = 'Não foi possível acessar a câmera. Verifique as permissões.';
      this.cameraAtiva = false;
    } finally {
      this.iniciandoCamera = false;
    }
  }

  pararCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoEl?.nativeElement) {
      this.videoEl.nativeElement.srcObject = null;
    }
    this.cameraAtiva = false;
  }

  capturarFoto(): void {
    const video = this.videoEl?.nativeElement;
    if (!video || !this.cameraAtiva) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      this.fotoOperador = new File([blob], `foto-operador-${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.fotoPreview = canvas.toDataURL('image/jpeg', 0.9);
      this.pararCamera();
    }, 'image/jpeg', 0.9);
  }

  refazerFoto(): void {
    this.fotoOperador = null;
    this.fotoPreview = null;
    this.iniciarCamera();
  }

  confirmarStatus(): void {
    if (!this.funcionarioSelecionadoId) {
      this.erroModal = 'Selecione o funcionario responsavel.';
      return;
    }
    if (!this.fotoOperador) {
      this.erroModal = 'A foto do operador e obrigatoria.';
      return;
    }
    if (!this.ordem) return;
    this.salvando = true;
    this.erroModal = '';

    this.service.alterarStatus(this.ordem.id, this.novoStatus, this.observacao, this.fotoOperador, this.funcionarioSelecionadoId).pipe(
      switchMap(() => this.service.obter(this.ordem!.id))
    ).subscribe({
      next: ordem => {
        this.ordem = ordem;
        this.modalAberto = false;
        this.salvando = false;
        this.pararCamera();
      },
      error: () => {
        this.erroModal = 'Erro ao alterar status. Tente novamente.';
        this.salvando = false;
      }
    });
  }

  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR');
  }

  arquivoUrl(url: string | null | undefined): string {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) return url;
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }

  abrirEdicaoFuncaoSetor(): void {
    if (!this.ordem) return;
    this.funcaoEdit = this.ordem.funcao;
    this.setorEdit = this.ordem.setor;
    this.funcionarioFuncaoSetorId = 0;
    this.erroFuncaoSetor = '';
    this.editandoFuncaoSetor = true;
  }

  cancelarEdicaoFuncaoSetor(): void {
    this.editandoFuncaoSetor = false;
    this.erroFuncaoSetor = '';
  }

  salvarFuncaoSetor(): void {
    if (!this.ordem) return;
    if (!this.funcionarioFuncaoSetorId) {
      this.erroFuncaoSetor = 'Selecione o funcionário responsável pela alteração.';
      return;
    }
    this.salvandoFuncaoSetor = true;
    this.erroFuncaoSetor = '';
    this.service.alterarFuncaoSetor(this.ordem.id, this.funcaoEdit, this.setorEdit, this.funcionarioFuncaoSetorId).subscribe({
      next: ordem => {
        this.ordem = ordem;
        this.editandoFuncaoSetor = false;
        this.salvandoFuncaoSetor = false;
      },
      error: () => {
        this.erroFuncaoSetor = 'Erro ao salvar. Tente novamente.';
        this.salvandoFuncaoSetor = false;
      }
    });
  }
}
