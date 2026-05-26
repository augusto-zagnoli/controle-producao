import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly settingsService = inject(SettingsService);

  nomeEmpresa = '';
  logoBase64: string | null = null;
  logoPreview: string | null = null;
  carregando = false;
  salvando = false;
  sucesso = '';
  erro = '';

  ngOnInit(): void {
    this.carregarSettings();
  }

  carregarSettings(): void {
    this.carregando = true;
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.nomeEmpresa = settings.nomeEmpresa || '';
        this.logoPreview = settings.logoUrl || null;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar settings:', err);
        this.carregando = false;
      }
    });
  }

  abrirSeletor(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.erro = 'Por favor, selecione uma imagem válida.';
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.erro = 'A imagem não pode ter mais de 5MB.';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoBase64 = e.target?.result as string;
        this.logoPreview = this.logoBase64;
        this.erro = '';
      };
      reader.readAsDataURL(file);
    }
  }

  removerLogo(): void {
    this.logoBase64 = null;
    this.logoPreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  salvar(): void {
    this.salvando = true;
    this.erro = '';
    this.sucesso = '';

    const dto = {
      nomeEmpresa: this.nomeEmpresa,
      logoBase64: this.logoBase64 || undefined
    };

    this.settingsService.atualizarSettings(dto).subscribe({
      next: () => {
        this.sucesso = 'Configurações salvas com sucesso!';
        this.salvando = false;
        setTimeout(() => this.sucesso = '', 3000);
      },
      error: (err) => {
        this.erro = err.error?.erro || 'Erro ao salvar configurações.';
        this.salvando = false;
      }
    });
  }
}
