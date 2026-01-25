import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogConfig, DialogButton } from '../services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (dialog of dialogs(); track dialog.id) {
      <!-- Modal backdrop -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
        (click)="onBackdropClick(dialog.id)"
      >
        <!-- Modal content -->
        <div
          class="rounded-xl max-w-md w-full shadow-2xl transform transition-all animate-scaleIn"
          [ngClass]="getDialogThemeClass(dialog)"
          (click)="$event.stopPropagation()"
        >
          <!-- Icon & Title -->
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                [ngClass]="getIconBackgroundClass(dialog.type)"
              >
                <svg
                  class="w-6 h-6"
                  [ngClass]="getIconColorClass(dialog.type)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  @switch (dialog.type) {
                    @case ('success') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    }
                    @case ('error') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    }
                    @case ('warning') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    }
                    @case ('info') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    }
                  }
                </svg>
              </div>

              <!-- Title & Message -->
              <div class="flex-1 min-w-0">
                @if (dialog.title) {
                  <h3 class="text-lg font-semibold text-white mb-2">
                    {{ dialog.title }}
                  </h3>
                }
                <p class="text-sm text-neutral-300 leading-relaxed">
                  {{ dialog.message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="px-6 pb-6 flex justify-end gap-3">
            @for (button of dialog.buttons; track $index) {
              <button
                type="button"
                (click)="handleButtonClick(button, dialog.id)"
                [ngClass]="getButtonClass(button.variant || 'primary')"
                class="px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
              >
                {{ button.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.15s ease-out;
    }

    .animate-scaleIn {
      animation: scaleIn 0.15s ease-out;
    }
  `]
})
export class DialogComponent {
  private dialogService = inject(DialogService);

  dialogs = this.dialogService.dialogs$;

  getDialogThemeClass(dialog: DialogConfig): string {
    const isActor = dialog.userType === 'actor';

    if (isActor) {
      return 'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10 backdrop-blur-xl';
    } else {
      return 'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border border-[#364361]/30 backdrop-blur-xl';
    }
  }

  getIconBackgroundClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-500/10';
      case 'error':
        return 'bg-red-500/10';
      case 'warning':
        return 'bg-yellow-500/10';
      case 'info':
      default:
        return 'bg-blue-500/10';
    }
  }

  getIconColorClass(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  }

  getButtonClass(variant: string): string {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'secondary':
      default:
        return 'text-neutral-300 hover:text-white hover:bg-neutral-800 focus:ring-neutral-500';
    }
  }

  async handleButtonClick(button: DialogButton, dialogId: string): Promise<void> {
    if (button.action) {
      await button.action();
    } else {
      this.dialogService.close(dialogId);
    }
  }

  onBackdropClick(dialogId: string): void {
    // Close dialog when clicking backdrop (optional - you can remove this if you want to force button clicks)
    this.dialogService.close(dialogId);
  }
}
