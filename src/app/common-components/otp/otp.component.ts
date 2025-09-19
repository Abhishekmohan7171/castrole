import { Component, ElementRef, EventEmitter, HostListener, Input, Output, QueryList, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="onClose()" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-2xl shadow-black/60 p-6 sm:p-8 text-neutral-200"
        role="dialog"
        aria-modal="true"
        aria-label="OTP verification dialog"
      >
        <!-- Close button -->
        <button
          type="button"
          (click)="onClose()"
          class="absolute right-3 top-3 p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          aria-label="Close"
        >
          <svg class="h-5 w-5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <!-- Header -->
        <div class="text-center mb-6">
          <h2 class="text-xl sm:text-2xl font-semibold text-neutral-100">Verify OTP</h2>
          <p class="mt-2 text-sm text-neutral-400">
            Enter the 6-digit code sent to
            <span class="text-neutral-200 font-medium" *ngIf="phone as p">{{ maskPhone(p) }}</span>
          </p>
          <p *ngIf="errorMsg" class="mt-2 text-sm text-red-400">{{ errorMsg }}</p>
        </div>

        <!-- OTP inputs -->
        <form (submit)="onSubmit($event)" class="flex flex-col items-center gap-6">
          <div class="grid grid-cols-6 gap-2 sm:gap-3 w-full">
            <ng-container *ngFor="let _ of digits; let i = index">
              <input
                #otpInput
                [value]="digits[i]"
                (input)="onInput(i, $event)"
                (keydown)="onKeyDown(i, $event)"
                (focus)="selectAll($event)"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="one-time-code"
                maxlength="1"
                [attr.aria-label]="'Digit ' + (i + 1)"
                class="h-12 sm:h-14 text-center text-lg sm:text-xl tracking-widest rounded-xl bg-neutral-800/80 text-neutral-100 placeholder-neutral-500 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/60 outline-none"
              />
            </ng-container>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="submit"
              [disabled]="!isComplete()"
              class="w-full sm:flex-1 rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition"
            >
              verify
            </button>
            <button type="button" (click)="onResend()" class="text-sm text-neutral-400 hover:text-neutral-200 transition">
              resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class OtpComponent {
  @Input() open = true;
  @Input() phone: string | null = null;
  @Input() length = 6;

  @Output() verify = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() resend = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);

  errorMsg = '';
  digits: string[] = Array(this.length).fill('');

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  ngOnChanges(): void {
    // Keep array length in sync if bound length changes
    if (this.digits.length !== this.length) {
      this.digits = Array(this.length).fill('');
    }
  }

  // Dismiss on Escape
  @HostListener('document:keydown.escape') onEscape() {
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }

  selectAll(ev: Event) {
    const el = ev.target as HTMLInputElement;
    requestAnimationFrame(() => el.select());
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = (input.value || '').replace(/\D/g, '');
    this.digits[index] = val.slice(-1);
    if (val && index < this.length - 1) this.focus(index + 1);
  }

  onKeyDown(index: number, event: KeyboardEvent) {
    const key = event.key;
    if (key === 'Backspace') {
      if (!this.digits[index] && index > 0) this.focus(index - 1);
      return;
    }
    if (!/^[0-9]$/.test(key) && key.length === 1) {
      // Block non-digits
      event.preventDefault();
    }
    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focus(index - 1);
    }
    if (key === 'ArrowRight' && index < this.length - 1) {
      event.preventDefault();
      this.focus(index + 1);
    }
  }

  // Handle paste of full code
  @HostListener('paste', ['$event']) onPaste(ev: ClipboardEvent) {
    const text = (ev.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, this.length);
    if (!text) return;
    ev.preventDefault();
    this.digits = text.split('').concat(Array(this.length - text.length).fill(''));
    // Focus last filled or next
    const idx = Math.min(text.length, this.length - 1);
    this.focus(idx);
  }

  focus(i: number) {
    const el = this.otpInputs?.get(i)?.nativeElement;
    if (el) el.focus();
  }

  isComplete(): boolean {
    return this.digits.every((d) => d.length === 1);
  }

  async onSubmit(ev: Event) {
    ev.preventDefault();
    if (!this.isComplete()) return;

    const code = this.digits.join('');

    // If the component is embedded in a parent template, use the output
    if (this.verify.observers?.length) {
      this.verify.emit(code);
      return;
    }

    // If routed as a standalone page, try confirming via AuthService
    const confirmation = this.auth.getLastPhoneConfirmation();
    if (!confirmation) {
      this.errorMsg = 'No pending verification. Please go back and request a new OTP.';
      return;
    }
    try {
      await this.auth.confirmPhoneVerification(confirmation, code, this.auth.getLastPhoneDisplay());
      // After success, navigate back to actor onboarding with a verified flag
      this.router.navigate(['/onboarding/actor'], { queryParams: { verified: '1' }, replaceUrl: true });
    } catch (e: any) {
      this.errorMsg = e?.message || 'Invalid OTP. Please try again.';
    }
  }

  onResend() {
    if (this.resend.observers?.length) {
      this.resend.emit();
      return;
    }
    // Routed mode: suggest going back and re-requesting
    this.errorMsg = 'Please go back and tap Verify again to resend the OTP.';
  }

  maskPhone(p: string): string {
    // Simple mask: preserve last 2-4 digits
    const digits = p.replace(/\D/g, '');
    if (digits.length <= 4) return p;
    const last = digits.slice(-4);
    return p.replace(digits, `${'*'.repeat(Math.max(0, digits.length - 4))}${last}`);
  }
}
