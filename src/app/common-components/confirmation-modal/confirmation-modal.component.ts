import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        (click)="onBackdropClick($event)"
      >
        <div
          class="bg-neutral-900 ring-2 ring-white/10 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-800">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-white">
                {{ title }}
              </h2>
              <button
                type="button"
                (click)="onCancel()"
                class="text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-5">
            <div class="flex items-start gap-3">
              <!-- Warning Icon -->
              <div class="flex-shrink-0">
                <svg
                  class="w-6 h-6 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.97-1.333-2.732 0L4.082 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <!-- Message -->
              <div class="flex-1">
                <p class="text-sm text-neutral-300 leading-relaxed">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 border-t border-neutral-800 flex gap-3 justify-end">
            <button
              type="button"
              (click)="onCancel()"
              class="px-4 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmationModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel(): void {
    this.cancel.emit();
    this.isOpen = false;
  }
}
