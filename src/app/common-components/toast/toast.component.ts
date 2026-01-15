import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div
          [@slideIn]
          class="pointer-events-auto max-w-sm w-full rounded-xl shadow-2xl backdrop-blur-sm"
          [ngClass]="{
            'bg-neutral-900/95 border-2 border-purple-500': toast.type === 'upload',
            'bg-emerald-900/95 border-2 border-emerald-500': toast.type === 'success',
            'bg-red-900/95 border-2 border-red-500': toast.type === 'error',
            'bg-amber-900/95 border-2 border-amber-500': toast.type === 'warning',
            'bg-blue-900/95 border-2 border-blue-500': toast.type === 'info'
          }"
        >
          <div class="p-4">
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="flex-shrink-0">
                @if (toast.type === 'upload') {
                  <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                }
                @if (toast.type === 'success') {
                  <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                }
                @if (toast.type === 'error') {
                  <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                }
                @if (toast.type === 'warning') {
                  <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.97-1.333-2.732 0L4.082 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                }
                @if (toast.type === 'info') {
                  <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                }
              </div>

              <!-- Message -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white mb-1">
                  {{ toast.message }}
                </p>
                @if (toast.type === 'upload' && toast.progress !== undefined) {
                  <p class="text-xs text-neutral-400">
                    {{ toast.progress.toFixed(0) }}% complete
                  </p>
                }
              </div>
            </div>

            <!-- Upload Progress Bar -->
            @if (toast.type === 'upload' && toast.progress !== undefined) {
              <div class="mt-3 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300 ease-out"
                  [style.width.%]="toast.progress"
                ></div>
              </div>
            }

            <!-- Auto-dismiss Progress Bar -->
            @if (toast.duration && toast.duration > 0 && toast.type !== 'upload') {
              <div class="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
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

  getProgress(toast: { timestamp: number; duration?: number }): number {
    if (!toast.duration || toast.duration <= 0) return 100;

    const elapsed = Date.now() - toast.timestamp;
    const progress = 100 - (elapsed / toast.duration) * 100;
    return Math.max(0, Math.min(100, progress));
  }
}
