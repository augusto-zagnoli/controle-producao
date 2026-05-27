import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { OrdemServico, STATUS_LABELS, OrdemServicoStatus, Setor } from '../../models/ordem-servico.model';
import { Funcionario } from '../../models/funcionario.model';
import { OrdensService } from '../../services/ordens.service';
import { FuncionariosService } from '../../services/funcionarios.service';
import { OpcoesService } from '../../services/opcoes.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FileViewerDialogComponent } from '../../shared/file-viewer-dialog/file-viewer-dialog.component';

@Component({
  selector: 'app-producao-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatDialogModule],
  templateUrl: './producao-detail.component.html',
  styleUrl: './producao-detail.component.scss'
})
export class ProducaoDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdensService);
  private readonly funcionariosService = inject(FuncionariosService);
  private readonly opcoesService = inject(OpcoesService);
  private readonly dialog = inject(MatDialog);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  ordem: OrdemServico | null = null;
  carregando = true;
  erro = '';

  novoStatus: OrdemServicoStatus = 'EmProducao';
  observacao = '';
  fotoOperador: File | null = null;
  fotoPreview: string | null = null;
  salvando = false;
  erroStatus = '';

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

  setorOptions: string[] = [];
  equipamentoOptions: string[] = [];

  setorEdit: Setor = 'Usinagem';
  funcionarioFuncaoSetorId = 0;
  equipamentoEdit: string = '';
  quantidadeRecebida = 0;
  erroFuncaoSetor = '';

  ngOnInit(): void {
    this.funcionariosService.listar(true).subscribe({ next: lista => { this.funcionarios = lista; } });
    this.opcoesService.listar().subscribe({
      next: lista => {
        this.setorOptions       = lista.filter(o => o.tipo === 'Setor'       && o.ativo && o.nome).map(o => o.nome);
        this.equipamentoOptions = lista.filter(o => o.tipo === 'Equipamento' && o.ativo && o.nome).map(o => o.nome);
      }
    });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregando = true;
    this.service.obter(id).subscribe({
      next: ordem => {
        this.ordem = ordem;
        this.novoStatus = ordem.status;
        this.setorEdit      = ordem.setor;
        this.equipamentoEdit = ordem.equipamento ?? '';
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar a ordem de servico.';
        this.carregando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.pararCamera();
  }

  async iniciarCamera(): Promise<void> {
    if (this.cameraAtiva || this.iniciandoCamera) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.erroStatus = 'Câmera não disponível neste dispositivo/navegador.';
      return;
    }
    this.iniciandoCamera = true;
    this.erroStatus = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      this.cameraAtiva = true;
      setTimeout(() => {
        if (this.videoEl?.nativeElement && this.stream) {
          this.videoEl.nativeElement.srcObject = this.stream;
          this.videoEl.nativeElement.play().catch(() => { /* ignore */ });
        }
      }, 0);
    } catch {
      this.erroStatus = 'Não foi possível acessar a câmera. Verifique as permissões.';
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

  salvarTudo(): void {
    if (!this.ordem) return;

    this.erroFuncaoSetor = '';
    this.erroStatus = '';

    if (!this.funcionarioFuncaoSetorId) {
      this.erroFuncaoSetor = 'Selecione o funcionário responsável.';
      return;
    }
    if (!this.funcionarioSelecionadoId) {
      this.erroStatus = 'Selecione o funcionário que está realizando a ação.';
      return;
    }
    if (!this.fotoOperador) {
      this.erroStatus = 'A foto do operador é obrigatória.';
      return;
    }

    this.salvando = true;

    this.service.alterarFuncaoSetor(
      this.ordem.id,
      this.ordem.funcao,
      this.setorEdit,
      this.funcionarioFuncaoSetorId,
      this.quantidadeRecebida,
      this.equipamentoEdit || null
    ).pipe(
      switchMap(ordem => {
        this.ordem = ordem;
        return this.service.alterarStatus(
          this.ordem!.id,
          this.novoStatus,
          this.observacao,
          this.fotoOperador!,
          this.funcionarioSelecionadoId
        );
      }),
      switchMap(() => this.service.obter(this.ordem!.id))
    ).subscribe({
      next: ordem => {
        this.ordem = ordem;
        this.salvando = false;
        this.pararCamera();
      },
      error: () => {
        this.erroStatus = 'Erro ao salvar. Tente novamente.';
        this.salvando = false;
      }
    });
  }

  abrirArquivo(dadosBase64: string, contentType: string, nome: string, tipo: 'imagem' | 'pdf'): void {
    this.dialog.open(FileViewerDialogComponent, {
      data: { dadosBase64, contentType, nome, tipo },
      width: '90vw',
      maxWidth: '1100px',
      height: '90vh',
      panelClass: 'file-viewer-dialog'
    });
  }

  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  formatarData(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR');
  }
}
