import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc, updateDoc, serverTimestamp, deleteField, arrayUnion } from '@angular/fire/firestore';
import { LoaderComponent } from '../../common-components/loader/loader.component';
import { UserDoc, EmailHistoryEntry } from '../../../assets/interfaces/interfaces';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Loader -->
      <app-loader [show]="loading" message="Verifying email..."></app-loader>

      <!-- Brand -->
      <h1 class="pt-16 pb-8 text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <h2 class="text-2xl font-bold mb-6 text-neutral-200">Email Verification</h2>

        <!-- Success State -->
        @if (state() === 'success') {
          <div class="space-y-6">
            <div class="text-center space-y-4">
              <!-- Success icon -->
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <svg class="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <div>
                <p class="text-neutral-200 font-medium text-lg mb-2">Email verified successfully!</p>
                <p class="text-neutral-400 text-sm mb-3">
                  Your email <span class="text-emerald-400 font-medium">{{ newEmail() }}</span> has been verified.
                </p>
                <p class="text-neutral-400 text-sm">
                  Your account is now fully verified.
                </p>
              </div>
            </div>

            <div class="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-lg">
              <p class="text-sm text-emerald-400">
                Redirecting to settings in {{ redirectCountdown() }} seconds...
              </p>
            </div>

            <button routerLink="/discover/settings" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
              Go to Settings Now
            </button>
          </div>
        }

        <!-- Error State -->
        @if (state() === 'error' || state() === 'expired' || state() === 'invalid') {
          <div class="space-y-6">
            <div class="text-center space-y-4">
              <!-- Error icon -->
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
                <svg class="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>

              <div>
                <p class="text-neutral-200 font-medium text-lg mb-2">
                  @if (state() === 'expired') {
                    Verification Link Expired
                  } @else if (state() === 'invalid') {
                    Invalid Verification Link
                  } @else {
                    Verification Failed
                  }
                </p>
                <p class="text-neutral-400 text-sm">
                  {{ errorMessage() }}
                </p>
              </div>
            </div>

            @if (state() === 'expired') {
              <div class="p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg">
                <p class="text-sm text-amber-400">
                  You can request a new verification email from your account settings.
                </p>
              </div>
            }

            <div class="flex flex-col gap-3">
              <button routerLink="/discover/settings" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
                Go to Settings
              </button>
              <button routerLink="/login" class="w-full rounded-full bg-transparent hover:bg-neutral-800 text-neutral-400 py-3 font-medium ring-1 ring-white/5 transition">
                Back to Login
              </button>
            </div>
          </div>
        }

        <!-- Loading State -->
        @if (state() === 'loading') {
          <div class="space-y-6">
            <div class="text-center space-y-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20">
                <svg class="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>

              <p class="text-neutral-400 text-sm">Verifying your email address...</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  loading = false;
  state = signal<'loading' | 'success' | 'error' | 'expired' | 'invalid'>('loading');
  errorMessage = signal('');
  newEmail = signal('');
  redirectCountdown = signal(3);

  private oobCode: string | null = null;
  private redirectInterval: any = null;

  ngOnInit(): void {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode');

    if (!this.oobCode) {
      this.state.set('invalid');
      this.errorMessage.set('No verification code found in the URL. Please use the link from your email.');
      return;
    }

    this.verifyEmail();
  }

  private async verifyEmail(): Promise<void> {
    this.loading = true;
    this.state.set('loading');

    try {
      if (!this.oobCode) {
        throw new Error('No verification code');
      }

      // Apply email verification
      await this.authService.applyEmailVerification(this.oobCode);

      // Get the verified email
      const user = this.authService.getCurrentUser();
      if (user?.email) {
        this.newEmail.set(user.email);
      }

      // Success!
      this.state.set('success');
      this.startRedirectCountdown();

    } catch (error: any) {
      console.error('[VerifyEmail] Verification error:', error);

      const errorMsg = error.message || 'An error occurred';

      if (errorMsg.includes('expired')) {
        this.state.set('expired');
        this.errorMessage.set('This verification link has expired. Please request a new one from your account settings.');
      } else if (errorMsg.includes('Invalid') || errorMsg.includes('already used')) {
        this.state.set('invalid');
        this.errorMessage.set('This verification link is invalid or has already been used.');
      } else {
        this.state.set('error');
        this.errorMessage.set(errorMsg);
      }
    } finally {
      this.loading = false;
    }
  }

  private startRedirectCountdown(): void {
    this.redirectCountdown.set(3);
    this.redirectInterval = setInterval(() => {
      const current = this.redirectCountdown();
      if (current <= 1) {
        clearInterval(this.redirectInterval);
        this.router.navigate(['/discover/settings'], { queryParams: { tab: 'account' } });
      } else {
        this.redirectCountdown.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.redirectInterval) {
      clearInterval(this.redirectInterval);
    }
  }
}
