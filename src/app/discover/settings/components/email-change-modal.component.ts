import {
  Component,
  Output,
  EventEmitter,
  Input,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import {
  Firestore,
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-email-change-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      (click)="onBackdropClick($event)"
    >
      <div
        class="bg-neutral-900 ring-2 ring-white/10 border border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 rounded-t-2xl"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">
              Change Email Address
            </h2>
            <button
              type="button"
              (click)="onClose()"
              class="text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p class="text-sm text-neutral-400 mt-1">
            {{ stepDescription() }}
          </p>
        </div>

        <!-- Verify Current Email -->
        @if (step() === 'verify-current') {
        <div class="p-6 space-y-5">
          <div class="text-center space-y-4">
            <!-- Warning icon -->
            <div
              class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20"
            >
              <svg
                class="h-8 w-8 text-amber-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div>
              <p class="text-neutral-200 font-medium text-lg mb-2">
                Email Verification Required
              </p>
              <p class="text-neutral-400 text-sm mb-3">
                Before changing your email, you need to verify your current
                email address:
                <span class="text-purple-400 font-medium">{{
                  currentEmail
                }}</span>
              </p>
            </div>

            <div
              class="p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg text-left"
            >
              <p class="text-sm text-blue-400 mb-2">
                <strong>Why verify?</strong>
              </p>
              <p class="text-sm text-neutral-400">
                This security measure ensures that only the account owner can
                change the email address.
              </p>
            </div>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
          <div class="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
            <p class="text-sm text-red-400">{{ errorMessage() }}</p>
          </div>
          }

          <!-- Send Verification Button -->
          <div class="pt-4 border-t border-neutral-800">
            @if (resendCooldown() > 0) {
            <button
              type="button"
              disabled
              class="w-full px-4 py-2.5 bg-neutral-800 text-neutral-500 rounded-lg cursor-not-allowed font-medium"
            >
              Resend in {{ resendCooldown() }}s
            </button>
            } @else {
            <button
              type="button"
              (click)="onSendCurrentEmailVerification()"
              [disabled]="isSubmitting()"
              class="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              @if (isSubmitting()) {
              <span class="flex items-center justify-center gap-2">
                <svg
                  class="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
              } @else { Send Verification Email }
            </button>
            }
          </div>

          <!-- Cancel Button -->
          <button
            type="button"
            (click)="onClose()"
            [disabled]="isSubmitting()"
            class="w-full px-4 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>

          <!-- Info text -->
          <p class="text-xs text-neutral-500 text-center">
            After clicking the verification link in your email, this dialog will
            automatically proceed to the next step.
          </p>
        </div>
        }

        <!-- New Email Entry -->
        @if (step() === 'newemail') {
        <form
          [formGroup]="emailForm"
          (ngSubmit)="onEmailSubmit()"
          class="p-6 space-y-5"
        >
          <div>
            <label class="block text-sm font-medium text-neutral-300 mb-1">
              Current Email
            </label>
            <input
              type="email"
              [value]="currentEmail"
              readonly
              class="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-400 cursor-not-allowed mb-4"
            />

            <label class="block text-sm font-medium text-neutral-300 mb-1">
              New Email <span class="text-red-400">*</span>
            </label>
            <input
              type="email"
              formControlName="newEmail"
              placeholder="Enter new email address"
              class="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              [class.border-red-500]="
                emailForm.get('newEmail')?.invalid &&
                emailForm.get('newEmail')?.touched
              "
            />
            @if (emailForm.get('newEmail')?.invalid &&
            emailForm.get('newEmail')?.touched) {
            <p class="text-xs text-red-400 mt-1">
              Please enter a valid email address
            </p>
            }
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
          <div class="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
            <p class="text-sm text-red-400">{{ errorMessage() }}</p>
          </div>
          }

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              (click)="onClose()"
              [disabled]="isSubmitting()"
              class="flex-1 px-4 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="emailForm.invalid || isSubmitting()"
              class="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              @if (isSubmitting()) {
              <span class="flex items-center justify-center gap-2">
                <svg
                  class="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Updating...
              </span>
              } @else { Update Email }
            </button>
          </div>
        </form>
        }

        <!-- Verification Sent -->
        @if (step() === 'sent') {
        <div class="p-6 space-y-5">
          <div class="text-center space-y-4">
            <!-- Success icon -->
            <div
              class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20"
            >
              <svg
                class="h-8 w-8 text-emerald-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>

            <div>
              <p class="text-neutral-200 font-medium text-lg mb-2">
                Email updated successfully!
              </p>
              <p class="text-neutral-400 text-sm mb-3">
                Your email has been changed to
                <span class="text-emerald-400 font-medium">{{
                  pendingNewEmail()
                }}</span>
              </p>
              <p class="text-neutral-400 text-sm">
                We've sent a verification email. Please check your inbox and
                verify your new email address.
              </p>
            </div>

            <div
              class="p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg"
            >
              <p class="text-sm text-blue-400">
                You can continue using your account while the email is
                unverified. The verification link will expire in 1 hour.
              </p>
            </div>
          </div>

          <!-- Resend Button -->
          <div class="pt-4 border-t border-neutral-800">
            @if (resendCooldown() > 0) {
            <button
              type="button"
              disabled
              class="w-full px-4 py-2.5 bg-neutral-800 text-neutral-500 rounded-lg cursor-not-allowed font-medium"
            >
              Resend in {{ resendCooldown() }}s
            </button>
            } @else {
            <button
              type="button"
              (click)="onResendVerification()"
              [disabled]="isSubmitting()"
              class="w-full px-4 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              @if (isSubmitting()) {
              <span class="flex items-center justify-center gap-2">
                <svg
                  class="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
              } @else { Resend Verification Email }
            </button>
            }
          </div>

          <!-- Done Button -->
          <button
            type="button"
            (click)="onClose()"
            class="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class EmailChangeModalComponent {
  @Input() currentEmail!: string;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  step = signal<'verify-current' | 'newemail' | 'sent'>('verify-current');
  isCurrentEmailVerified = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');
  resendCooldown = signal(0);
  pendingNewEmail = signal('');

  private cooldownInterval: any = null;

  emailForm!: FormGroup;

  stepDescription = computed(() => {
    const stepMap = {
      'verify-current': 'Verify your current email address',
      newemail: 'Enter your new email address',
      sent: 'Verify your new email address',
    };
    return stepMap[this.step()];
  });

  constructor() {
    this.initializeForms();
    this.checkCurrentEmailVerification();
    this.setupAuthStateListener();
  }

  private initializeForms(): void {
    this.emailForm = this.fb.group({
      newEmail: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        ],
      ],
    });
  }

  private checkCurrentEmailVerification(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.isCurrentEmailVerified.set(user.emailVerified);
      if (user.emailVerified) {
        this.step.set('newemail');
      }
    }
  }

  private setupAuthStateListener(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.isCurrentEmailVerified.set(user.emailVerified);
        if (user.emailVerified && this.step() === 'verify-current') {
          this.step.set('newemail');
        }
      }
    });
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    if (!this.isSubmitting()) {
      if (this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
      }
      this.close.emit();
    }
  }

  async onEmailSubmit(): Promise<void> {
    if (this.emailForm.invalid || this.isSubmitting()) {
      return;
    }

    // Ensure current email is verified before allowing change
    if (!this.isCurrentEmailVerified()) {
      this.errorMessage.set('Please verify your current email first');
      this.step.set('verify-current');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const { newEmail } = this.emailForm.value;
      const trimmedEmail = newEmail.trim();

      // Check if email is already in use
      const emailInUse = await this.authService.isEmailInUse(trimmedEmail);
      if (emailInUse) {
        this.errorMessage.set(
          'This email is already registered to another account'
        );
        this.isSubmitting.set(false);
        return;
      }

      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Store old email for history
      const oldEmail = user.email || this.currentEmail;

      // Update email in Firebase Auth
      await this.authService.updateUserEmail(trimmedEmail);

      // Send verification email to NEW email
      await this.authService.sendVerificationEmail();

      // Update Firestore with new email and add to history
      const userDocRef = doc(this.firestore, 'users', user.uid);

      const historyEntry = {
        email: trimmedEmail,
        changedAt: serverTimestamp(),
        changedFrom: oldEmail,
        reason: 'user_initiated' as const,
      };

      await updateDoc(userDocRef, {
        email: trimmedEmail,
        emailHistory: arrayUnion(historyEntry),
        updatedAt: serverTimestamp(),
      });

      // Store the email for display
      this.pendingNewEmail.set(trimmedEmail);

      // Move to success step
      this.step.set('sent');
      this.success.emit();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to update email');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onSendCurrentEmailVerification(): Promise<void> {
    if (this.isSubmitting() || this.resendCooldown() > 0) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.sendVerificationEmail();

      // Start cooldown
      this.startCooldown();
    } catch (error: any) {
      this.errorMessage.set(
        error.message || 'Failed to send verification email'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onResendVerification(): Promise<void> {
    if (this.isSubmitting() || this.resendCooldown() > 0) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.sendVerificationEmail();

      // Start cooldown
      this.startCooldown();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to resend verification');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(this.cooldownInterval);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }
}
