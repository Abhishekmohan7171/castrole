import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'upload';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // Optional for long-running uploads
  timestamp: number;
  progress?: number; // 0-100 for upload progress
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

  private addToast(type: ToastType, message: string, duration?: number, progress?: number): void {
    const toast: Toast = {
      id: this.generateId(),
      type,
      message,
      duration,
      timestamp: Date.now(),
      progress,
    };

    // Add new toast
    const currentToasts = this.toasts();
    this.toasts.set([...currentToasts, toast]);

    // Remove oldest toast if exceeding max
    if (this.toasts().length > this.maxToasts) {
      this.toasts.set(this.toasts().slice(1));
    }

    // Auto-dismiss after duration (if specified)
    if (duration && duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, duration);
    }
  }

  showUploadProgress(message: string): string {
    const id = this.generateId();
    const toast: Toast = {
      id,
      type: 'upload',
      message,
      progress: 0,
      timestamp: Date.now(),
      // No duration - won't auto-dismiss
    };

    const currentToasts = this.toasts();
    this.toasts.set([...currentToasts, toast]);

    if (this.toasts().length > this.maxToasts) {
      this.toasts.set(this.toasts().slice(1));
    }

    return id;
  }

  update(id: string, updates: Partial<Toast>): void {
    this.toasts.update(current =>
      current.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          // If duration is set during update, schedule auto-dismiss
          if (updates.duration && updates.duration > 0 && !t.duration) {
            setTimeout(() => this.dismiss(id), updates.duration);
          }
          return updated;
        }
        return t;
      })
    );
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
