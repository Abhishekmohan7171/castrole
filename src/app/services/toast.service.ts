import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private maxToasts = 5;

  // Expose toasts as a readonly signal
  readonly toasts$ = this.toasts.asReadonly();

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToast(type: ToastType, message: string, duration: number = 5000): void {
    const toast: Toast = {
      id: this.generateId(),
      type,
      message,
      duration,
      timestamp: Date.now(),
    };

    // Add new toast
    const currentToasts = this.toasts();
    this.toasts.set([...currentToasts, toast]);

    // Remove oldest toast if exceeding max
    if (this.toasts().length > this.maxToasts) {
      this.toasts.set(this.toasts().slice(1));
    }

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, duration);
    }
  }

  success(message: string, duration: number = 5000): void {
    this.addToast('success', message, duration);
  }

  error(message: string, duration: number = 7000): void {
    this.addToast('error', message, duration);
  }

  warning(message: string, duration: number = 6000): void {
    this.addToast('warning', message, duration);
  }

  info(message: string, duration: number = 5000): void {
    this.addToast('info', message, duration);
  }

  dismiss(id: string): void {
    this.toasts.set(this.toasts().filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
