import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../common-components/loader/loader.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Loader -->
      <app-loader [show]="loading" message="Processing..."></app-loader>
      
      <!-- Brand -->
      <h1 class="pt-16 pb-8 text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <h2 class="text-2xl font-bold mb-6 text-neutral-200">Reset your password</h2>
        
        <!-- Waiting for reset link step -->
        <div *ngIf="step === 'waiting'" class="space-y-6">
          <div class="text-center space-y-4">
            <!-- Email sent icon -->
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <svg class="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            
            <div>
              <p class="text-neutral-200 font-medium mb-2">Check your email</p>
              <p class="text-neutral-400 text-sm">We've sent a password reset link to <span class="text-neutral-200">{{ resetEmail }}</span></p>
              <p class="text-neutral-400 text-sm mt-2">Click the link in the email to reset your password.</p>
            </div>
          </div>
          
          <!-- Resend email form -->
          <div class="pt-4 border-t border-white/5">
            <p class="text-neutral-400 text-sm mb-4">Didn't receive the email?</p>
            <form [formGroup]="resendForm" (ngSubmit)="onResend()" class="space-y-4">
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="email"
                  formControlName="email"
                  class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
                />
              </div>
              
              <!-- Success/Error messages -->
              <div *ngIf="successMessage" class="text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                {{ successMessage }}
              </div>
              <p *ngIf="error" class="text-sm text-red-400">{{ error }}</p>
              
              <button type="submit" [disabled]="loading || resendForm.invalid" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
                resend email
              </button>
            </form>
          </div>
          
          <div class="pt-4">
            <button type="button" routerLink="/login" class="w-full rounded-full bg-transparent hover:bg-neutral-800 text-neutral-400 py-3 font-medium ring-1 ring-white/5 transition">
              back to login
            </button>
          </div>
        </div>
        
        <!-- Reset password step -->
        <div *ngIf="step === 'reset'" class="space-y-4">
          <p class="text-neutral-400 mb-6">Enter your new password below.</p>
          
          <form [formGroup]="resetForm" (ngSubmit)="onReset()" class="space-y-5">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16.5 10.5V7.5a4.5 4.5 0 0 0-9 0v3" />
                  <path d="M6.75 10.5h10.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75Z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="new password"
                formControlName="password"
                class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
              />
            </div>
            
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16.5 10.5V7.5a4.5 4.5 0 0 0-9 0v3" />
                  <path d="M6.75 10.5h10.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75Z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="confirm password"
                formControlName="confirmPassword"
                class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
              />
            </div>
            
            <!-- Password mismatch error -->
            <p *ngIf="resetForm.get('confirmPassword')?.hasError('passwordMismatch') && resetForm.get('confirmPassword')?.touched" class="text-sm text-red-400 -mt-2">
              Passwords do not match
            </p>
            
            <!-- Error -->
            <p *ngIf="error" class="text-sm text-red-400">{{ error }}</p>
            
            <button type="submit" [disabled]="loading || resetForm.invalid" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
              reset password
            </button>
          </form>
        </div>
        
        <!-- Success step -->
        <div *ngIf="step === 'success'" class="space-y-6">
          <div class="text-center space-y-4">
            <!-- Success icon -->
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <svg class="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            
            <div>
              <p class="text-neutral-200 font-medium text-lg mb-2">Password reset successful!</p>
              <p class="text-neutral-400 text-sm">Your password has been updated. You can now log in with your new password.</p>
            </div>
          </div>
          
          <button routerLink="/login" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            go to login
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  loading = false;
  error = '';
  successMessage = '';
  resetEmail = '';
  step: 'waiting' | 'reset' | 'success' = 'waiting';
  
  // Action code from URL
  private actionCode: string | null = null;
  
  // Form for resending email
  resendForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  
  // Form for password reset
  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });
  
  ngOnInit(): void {
    // Get the action code from the URL
    this.actionCode = this.route.snapshot.queryParamMap.get('oobCode');
    
    // Get email from query params (if redirected from login page)
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.resetEmail = email;
      this.resendForm.patchValue({ email });
    }
    
    if (this.actionCode) {
      // If we have an action code, move directly to reset step
      this.step = 'reset';
    }
  }
  
  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }
  
  async onResend(): Promise<void> {
    if (this.resendForm.invalid) return;
    
    const { email } = this.resendForm.value;
    if (!email) return;
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    try {
      await this.authService.sendPasswordResetEmail(email);
      this.successMessage = 'Password reset email sent! Please check your inbox.';
      this.resetEmail = email;
    } catch (e: any) {
      console.error('[reset-password] resend error', e);
      
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
  
  async onReset(): Promise<void> {
    if (this.resetForm.invalid) return;
    
    const { password } = this.resetForm.value;
    if (!password || !this.actionCode) return;
    
    this.loading = true;
    this.error = '';
    
    try {
      // Reset the password
      await this.authService.confirmPasswordReset(this.actionCode, password);
      this.step = 'success';
    } catch (e: any) {
      console.error('[reset-password] reset error', e);
      
      // Handle specific Firebase error codes
      if (e?.code === 'auth/expired-action-code') {
        this.error = 'This password reset link has expired. Please request a new one.';
      } else if (e?.code === 'auth/invalid-action-code') {
        this.error = 'Invalid password reset link. Please request a new one.';
      } else if (e?.code === 'auth/weak-password') {
        this.error = 'Password is too weak. Please choose a stronger password.';
      } else {
        this.error = e?.message || 'Failed to reset password';
      }
    } finally {
      this.loading = false;
    }
  }
}
