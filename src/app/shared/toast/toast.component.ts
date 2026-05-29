import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toast.toast$ | async; as t) {
      <div class="toast-overlay">
        <div class="toast" [class.success]="t.type === 'success'" [class.error]="t.type === 'error'">
          <span class="toast-icon">{{ t.type === 'success' ? '✓' : '✕' }}</span>
          <span class="toast-message">{{ t.message }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 32px;
      border-radius: 14px;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      box-shadow: 0 8px 32px rgba(0,0,0,0.22);
      animation: toast-in 0.25s ease;
      max-width: 480px;
      text-align: center;
      pointer-events: auto;
    }

    .toast.success { background: #16a34a; }
    .toast.error   { background: #dc2626; }

    .toast-icon {
      font-size: 24px;
      font-weight: 700;
      flex-shrink: 0;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
