import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { OrdemServico, STATUS_LABELS } from '../../models/ordem-servico.model';
import { OrdensService } from '../../services/ordens.service';
import { SettingsService, Settings } from '../../services/settings.service';
import { environment } from '../../../environments/environment';

interface MaquinaCard {
  nome: string;
  ordens: OrdemServico[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly service = inject(OrdensService);
  private readonly settingsService = inject(SettingsService);
  private readonly platformId = inject(PLATFORM_ID);

  ordens: OrdemServico[] = [];
  settings: Settings | null = null;
  carregando = true;
  horaAtual = '';
  ultimaAtualizacao = '';

  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  get emProducao(): OrdemServico[] {
    return this.ordens.filter(o => o.status === 'EmProducao');
  }
  get pendentes(): OrdemServico[] {
    return this.ordens.filter(o => o.status === 'Pendente');
  }
  get pausadas(): OrdemServico[] {
    return this.ordens.filter(o => o.status === 'Pausada');
  }

  get maquinas(): MaquinaCard[] {
    const map = new Map<string, OrdemServico[]>();
    for (const o of this.emProducao) {
      const key = o.equipamento?.trim() || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return Array.from(map.entries())
      .map(([nome, ordens]) => ({ nome, ordens }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.carregando = false;
      return;
    }

    this.atualizarRelogio();
    this.clockInterval = setInterval(() => this.atualizarRelogio(), 1000);

    this.settingsService.getSettings().subscribe({ next: s => this.settings = s, error: () => {} });

    this.carregar();
    this.refreshInterval = setInterval(() => this.carregar(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  carregar(): void {
    this.service.listar().subscribe({
      next: lista => {
        this.ordens = lista.filter(o => o.status !== 'Finalizada');
        this.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR');
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  prazoLabel(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  prazoVencido(iso: string): boolean {
    if (!iso) return false;
    return new Date(iso) < new Date();
  }

  logoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  }

  private atualizarRelogio(): void {
    this.horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
