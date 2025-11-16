import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div
          [@slideIn]
          (click)="dismiss(toast.id)"
          class="pointer-events-auto max-w-md w-full rounded-xl shadow-2xl cursor-pointer transform transition-transform hover:scale-105"
          [ngClass]="{
            'bg-emerald-900 border border-emerald-700': toast.type === 'success',
            'bg-red-900 border border-red-700': toast.type === 'error',
            'bg-amber-900 border border-amber-700': toast.type === 'warning',
            'bg-blue-900 border border-blue-700': toast.type === 'info'
          }"
        >
          <div class="p-4 flex items-start gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0 mt-0.5">
              @if (toast.type === 'success') {
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              }
              @if (toast.type === 'error') {
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              @if (toast.type === 'warning') {
                <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.97-1.333-2.732 0L4.082 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              @if (toast.type === 'info') {
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            </div>

            <!-- Message -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium leading-relaxed"
                [ngClass]="{
                  'text-emerald-100': toast.type === 'success',
                  'text-red-100': toast.type === 'error',
                  'text-amber-100': toast.type === 'warning',
                  'text-blue-100': toast.type === 'info'
                }"
              >
                {{ toast.message }}
              </p>
            </div>

            <!-- Close Button -->
            <button
              type="button"
              (click)="dismiss(toast.id); $event.stopPropagation()"
              class="flex-shrink-0 rounded-lg p-1 transition-colors"
              [ngClass]="{
                'hover:bg-emerald-800 text-emerald-300': toast.type === 'success',
                'hover:bg-red-800 text-red-300': toast.type === 'error',
                'hover:bg-amber-800 text-amber-300': toast.type === 'warning',
                'hover:bg-blue-800 text-blue-300': toast.type === 'info'
              }"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Progress Bar -->
          @if (toast.duration > 0) {
            <div class="h-1 bg-black/20 overflow-hidden rounded-b-xl">
              <div
                class="h-full transition-all ease-linear"
                [ngClass]="{
                  'bg-emerald-400': toast.type === 'success',
                  'bg-red-400': toast.type === 'error',
                  'bg-amber-400': toast.type === 'warning',
                  'bg-blue-400': toast.type === 'info'
                }"
                [style.width.%]="getProgress(toast)"
                [style.transition-duration.ms]="toast.duration"
              ></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent {
  toastService = inject(ToastService);

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  getProgress(toast: { timestamp: number; duration: number }): number {
    if (toast.duration <= 0) return 100;

    const elapsed = Date.now() - toast.timestamp;
    const progress = 100 - (elapsed / toast.duration) * 100;
    return Math.max(0, Math.min(100, progress));
  }
}
