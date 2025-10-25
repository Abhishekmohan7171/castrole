import { Component, ElementRef, HostListener, QueryList, ViewChildren, inject, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhoneAuthService } from '../../services/phone-auth.service';
import { OtpVerificationService } from '../../services/otp-verification.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal backdrop -->
    <div *ngIf="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <!-- Modal content -->
      <div class="w-full max-w-md rounded-3xl border border-white/5 shadow-2xl shadow-black/60 bg-black px-8 py-10 relative">
        <!-- Close button -->
        <button
          type="button"
          (click)="onClose()"
          class="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200 transition-colors"
          aria-label="Close modal"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-neutral-100 mb-3">Verify Mobile</h2>
          <p class="text-neutral-400">
            Enter the 6-digit code sent to
            <span class="text-neutral-200 font-medium" *ngIf="phone">{{ maskPhone(phone) }}</span>
          </p>
          @if (isTestNumber()) {
            <div class="mt-3 p-2 rounded-lg bg-blue-900/20 border border-blue-500/20 text-blue-400 text-sm">
              Development mode: Use code <span class="font-mono font-bold">123456</span>
            </div>
          }
        </div>

        <!-- Error message -->
        <div *ngIf="errorMessage" class="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm text-center">
          {{ errorMessage }}
        </div>

        <!-- OTP inputs -->
        <form (submit)="onSubmit($event)" class="space-y-6">
          <div class="grid grid-cols-6 gap-3">
            @for (_ of digits; track $index) {
              <input
                #otpInput
                [value]="digits[$index]"
                (input)="onInput($index, $event)"
                (keydown)="onKeyDown($index, $event)"
                (focus)="selectAll($event)"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="one-time-code"
                maxlength="1"
                [attr.aria-label]="'Digit ' + ($index + 1)"
                class="h-14 text-center text-xl tracking-widest rounded-xl bg-neutral-800/80 text-neutral-100 placeholder-neutral-500 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/60 outline-none transition"
              />
            }
          </div>

          <!-- Actions -->
          <div class="space-y-4">
            <button
              type="submit"
              [disabled]="!isComplete() || isVerifying"
              class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition"
            >
              {{ isVerifying ? 'verifying...' : 'verify' }}
            </button>
            <div class="text-center">
              <button 
                type="button" 
                (click)="onResend()" 
                [disabled]="isResending"
                class="text-sm text-neutral-400 hover:text-neutral-200 transition disabled:opacity-50"
              >
                {{ isResending ? 'sending...' : "didn't receive code? resend" }}
              </button>
            </div>
          </div>
        </form>

        <!-- Hidden reCAPTCHA container -->
        <div id="recaptcha-container"></div>
      </div>
    </div>
  `,
  styles: []
})
export class OtpComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isOpen = false;
  @Input() phone: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() otpVerified = new EventEmitter<void>();
  
  length = 6;
  digits: string[] = Array(this.length).fill('');
  errorMessage: string = '';
  isVerifying: boolean = false;
  isResending: boolean = false;

  private phoneAuth = inject(PhoneAuthService);
  private otpVerificationService = inject(OtpVerificationService);

  private inputSubjects: Subject<{index: number, value: string}>[] = [];

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  ngOnInit(): void {
    // Initialize digits array
    this.digits = Array(this.length).fill('');
    
    // Initialize input subjects for each digit
    for (let i = 0; i < this.length; i++) {
      const subject = new Subject<{index: number, value: string}>();
      subject.pipe(
        debounceTime(10), // Small debounce to prevent rapid firing
        distinctUntilChanged((prev, curr) => prev.value === curr.value)
      ).subscribe(({index, value}) => {
        this.handleDigitInput(index, value);
      });
      this.inputSubjects.push(subject);
    }
  }

  ngAfterViewInit(): void {
    // Initialize reCAPTCHA after view is ready
    this.phoneAuth.initializeRecaptcha('recaptcha-container');
  }

  open(phoneNumber: string): void {
    this.phone = phoneNumber;
    this.isOpen = true;
    this.clearOTP();
    this.errorMessage = '';
    
    // Ensure reCAPTCHA is initialized and send OTP when modal opens
    setTimeout(() => {
      this.phoneAuth.initializeRecaptcha('recaptcha-container');
      if (this.phone) {
        this.sendOTPToPhone();
      }
    }, 100); // Small delay to ensure DOM is ready
  }

  ngOnDestroy(): void {
    // Clean up reCAPTCHA verifier
    this.phoneAuth.cleanup();
    
    // Clean up RxJS subjects
    this.inputSubjects.forEach(subject => subject.complete());
  }

  // Dismiss on Escape
  @HostListener('document:keydown.escape') onEscape() {
    this.onClose();
  }

  onClose() {
    this.isOpen = false;
    this.clearOTP();
    this.errorMessage = '';
    this.closeModal.emit();
  }

  selectAll(ev: Event) {
    const el = ev.target as HTMLInputElement;
    requestAnimationFrame(() => el.select());
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = (input.value || '').replace(/\D/g, '');
    
    // Use RxJS subject to handle the input
    this.inputSubjects[index].next({index, value: val});
  }

  private handleDigitInput(index: number, val: string) {
    // Take only the last digit entered (in case multiple digits were pasted)
    const digit = val.slice(-1);
    this.digits[index] = digit;
    
    // Move to next input if we have a digit and not at the end
    if (digit && index < this.length - 1) {
      setTimeout(() => this.focus(index + 1), 0);
    }
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
    if (!this.isComplete() || this.isVerifying) return;
    
    this.isVerifying = true;
    this.errorMessage = '';
    
    const otp = this.digits.join('');
    
    try {
      const isValid = await this.phoneAuth.verifyOTP(otp);
      
      if (isValid) {
        // OTP verified successfully
        console.log('OTP verified successfully');
        
        // Mark phone as verified in the signal service (for onboarding UI)
        if (this.phone) {
          console.log('Marking phone as verified:', this.phone);
          this.otpVerificationService.markAsVerified(this.phone);
        }
        
        // Emit verification success and close modal
        this.otpVerified.emit();
        this.onClose();
      } else {
        this.errorMessage = 'Invalid OTP. Please try again.';
        this.clearOTP();
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      this.errorMessage = error.message || 'Failed to verify OTP. Please try again.';
      this.clearOTP();
    } finally {
      this.isVerifying = false;
    }
  }

  async onResend() {
    if (this.isResending || !this.phone) return;
    
    this.isResending = true;
    this.errorMessage = '';
    
    try {
      await this.sendOTPToPhone();
      this.clearOTP();
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      this.errorMessage = 'Failed to resend OTP. Please try again.';
    } finally {
      this.isResending = false;
    }
  }

  private async sendOTPToPhone(): Promise<void> {
    if (!this.phone) return;
    
    try {
      await this.phoneAuth.sendOTP(this.phone);
      console.log('OTP sent successfully to:', this.phone);
    } catch (error: any) {
      console.error('Send OTP error:', error);
      this.errorMessage = 'Failed to send OTP. Please try again.';
      throw error;
    }
  }

  private clearOTP(): void {
    this.digits = Array(this.length).fill('');
    this.focus(0);
  }

  isTestNumber(): boolean {
    if (!this.phone) return false;
    const testNumbers = ['+917358356139', '+916374087443'];
    return testNumbers.includes(this.phone);
  }

  maskPhone(p: string): string {
    // Simple mask: preserve last 2-4 digits
    const digits = p.replace(/\D/g, '');
    if (digits.length <= 4) return p;
    const last = digits.slice(-4);
    return p.replace(digits, `${'*'.repeat(Math.max(0, digits.length - 4))}${last}`);
  }
}
