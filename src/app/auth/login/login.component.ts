import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../common-components/loader/loader.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule, LoaderComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Loader -->
      <app-loader [show]="loading" message="Authenticating..."></app-loader>
      <!-- Brand -->
      <h1 class="pt-16 pb-8 text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl  border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <form class="space-y-5" [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <!-- user icon -->
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                <path d="M4.5 20.25a8.25 8.25 0 0 1 15 0" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="email"
              formControlName="email"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>

          <!-- Password -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <!-- lock icon -->
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M16.5 10.5V7.5a4.5 4.5 0 0 0-9 0v3" />
                <path d="M6.75 10.5h10.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75Z" />
              </svg>
            </span>
            <input
              [type]="showPassword ? 'text' : 'password'"
              placeholder="password"
              formControlName="password"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-12 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
            <button
              type="button"
              (click)="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
              [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
            >
              <!-- Eye icon (show) -->
              <svg *ngIf="!showPassword" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <!-- Eye-off icon (hide) -->
              <svg *ngIf="showPassword" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </button>
          </div>

          <div class="flex justify-end -mt-1">
            <button type="button" (click)="forgotPassword()" class="text-xs text-neutral-500 hover:text-neutral-300">forgot password?</button>
          </div>
          
          <!-- Password Reset Success Message -->
          <div *ngIf="resetEmailSent" class="text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            Password reset email sent. Please check your inbox.
          </div>

          <!-- Error -->
          <p *ngIf="error" class="text-sm text-red-400">{{ error }}</p>

          <button type="submit" [disabled]="loading || form.invalid" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            sign in
          </button>
        </form>
      </div>

      <!-- Register link -->
      <div class="mt-6 text-sm text-neutral-500">
        new? <a routerLink="/onboarding" class="text-neutral-300 font-semibold hover:text-white">register now</a>
      </div>

      <!-- Divider -->
      <div class="w-full max-w-4xl mt-10">
        <div class="flex items-center gap-4 text-neutral-500">
          <div class="h-px flex-1 bg-white/10"></div>
          <div>or</div>
          <div class="h-px flex-1 bg-white/10"></div>
        </div>

        <!-- Social buttons -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button type="button" (click)="onGoogle()" [disabled]="loading" class="group rounded-full ring-1 ring-white/10 bg-neutral-900/60 hover:bg-neutral-800/80 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-200 px-6 py-4 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.06)] transition">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 text-sm font-bold">G</span>
            <span class="tracking-wide">continue with google</span>
          </button>
          <button type="button" (click)="onApple()" [disabled]="loading" class="group rounded-full ring-1 ring-white/10 bg-neutral-900/60 hover:bg-neutral-800/80 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-200 px-6 py-4 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.06)] transition">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 text-base"></span>
            <span class="tracking-wide">continue with apple</span>
          </button>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  returnUrl: string = '/discover';
  loading = false;
  error = '';
  resetEmailSent = false;
  showPassword = false;
  ngOnInit() {
    // Get return url from route parameters or default to '/discover'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/discover';
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    await this.signinEmailandPassword();
  }

  async signinEmailandPassword() {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.loading = true;
    this.error = '';
    try {
      await this.authService.loginWithEmail(email, password);
      await this.router.navigateByUrl(this.returnUrl);
    } catch (e: any) {
      const msg = e?.message || 'Failed to sign in';
      this.error = msg;
      console.error('[login] error', e);
    } finally {
      this.loading = false;
    }
  }

  async onGoogle() {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    try {
      const { user, exists } = await this.authService.signInWithGoogle();
      
      // If user exists in the database, update login timestamp and navigate to return URL
      if (exists) {
        // Update login timestamp similar to email login
        await this.authService.updateLoginTimestamp(user.uid);
        await this.router.navigateByUrl(this.returnUrl);
      } else {
        // If user doesn't exist, redirect to onboarding with email pre-filled
        await this.router.navigate(['/onboarding'], {
          queryParams: { email: user.email || '' }
        });
      }
    } catch (e: any) {
      console.error('[login] google error', e);
      this.error = e?.message || 'Google sign-in failed';
    } finally {
      this.loading = false;
    }
  }

  async onApple() {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    try {
      const { user, exists } = await this.authService.signInWithApple();
      
      // If user exists in the database, update login timestamp and navigate to return URL
      if (exists) {
        // Update login timestamp similar to email login
        await this.authService.updateLoginTimestamp(user.uid);
        await this.router.navigateByUrl(this.returnUrl);
      } else {
        // If user doesn't exist, redirect to onboarding with email pre-filled
        await this.router.navigate(['/onboarding'], {
          queryParams: { email: user.email || '' }
        });
      }
    } catch (e: any) {
      console.error('[login] apple error', e);
      this.error = e?.message || 'Apple sign-in failed';
    } finally {
      this.loading = false;
    }
  }
  
  async forgotPassword() {
    // Reset previous states
    this.resetEmailSent = false;
    this.error = '';
    
    // Get email from form
    const email = this.form.get('email')?.value;
    
    // Validate email
    if (!email) {
      this.error = 'Please enter your email address';
      return;
    }
    
    if (!this.form.get('email')?.valid) {
      this.error = 'Please enter a valid email address';
      return;
    }
    
    this.loading = true;
    
    try {
      // Send password reset email
      await this.authService.sendPasswordResetEmail(email);
      
      // Redirect to custom reset password page
      await this.router.navigate(['/reset-password'], { queryParams: { email } });
    } catch (e: any) {
      console.error('[login] forgot password error', e);
      
      // Handle specific Firebase error codes
      if (e?.code === 'auth/user-not-found') {
        this.error = 'No account found with this email address';
      } else {
        this.error = e?.message || 'Failed to send password reset email';
      }
    } finally {
      this.loading = false;
    }
  }
}
