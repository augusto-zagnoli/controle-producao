import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toast$ = new BehaviorSubject<Toast | null>(null);
  readonly toast$ = this._toast$.asObservable();
  private timer: ReturnType<typeof setTimeout> | null = null;

  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  private show(message: string, type: 'success' | 'error', duration: number): void {
    if (this.timer) clearTimeout(this.timer);
    this._toast$.next({ message, type });
    this.timer = setTimeout(() => this._toast$.next(null), duration);
  }
}
