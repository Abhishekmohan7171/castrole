import { Component, inject } from '@angular/core';
import { OtpComponent } from '../common-components/otp/otp.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { ConfirmationResult } from 'firebase/auth';
import { UserDoc } from '../../assets/interfaces/interfaces';

@Component({
  selector: 'app-actor-onboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OtpComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Brand -->
      <h1 class="pt-16 pb-10 text-5xl sm:text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl  border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <form class="space-y-5" [formGroup]="form" autocomplete="off" novalidate>
          <!-- Stage name -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                <path d="M4.5 20.25a8.25 8.25 0 0 1 15 0" />
              </svg>
            </span>
            <input
              type="text"
              formControlName="stageName"
              placeholder="stage name"
              aria-label="stage name"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>

          <!-- Location -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 21s-6-4.35-6-9a6 6 0 1 1 12 0c0 4.65-6 9-6 9Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </span>
            <input
              type="text"
              formControlName="location"
              placeholder="location"
              aria-label="location"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>

          <!-- Email -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                <path d="m22 8-10 7L2 8" />
              </svg>
            </span>
            <input
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="email"
              aria-label="email"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>

          <!-- Password -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V8a5 5 0 0 1 10 0v3" />
              </svg>
            </span>
            <input
              type="password"
              formControlName="password"
              autocomplete="new-password"
              placeholder="password"
              aria-label="password"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>

          <!-- Mobile number (country code + number) -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11l-.9.9a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" />
              </svg>
            </span>
            <div class="pl-12 flex gap-2">
              <select formControlName="countryCode" aria-label="country code" class="w-28 sm:w-32 bg-neutral-800/80 text-neutral-200 rounded-full px-3 py-3 ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 outline-none">
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+65">+65 (SG)</option>
                <option value="+81">+81 (JP)</option>
                <option value="+91">+91 (IN)</option>
              </select>
              <input
                type="tel"
                formControlName="mobileNumber"
                inputmode="numeric"
                placeholder="mobile number"
                aria-label="mobile number"
                class="flex-1 bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
              />
            </div>
          </div>

          <button type="button" [disabled]="form.invalid" (click)="onNext()" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            next
          </button>
        </form>
      </div>
      <!-- reCAPTCHA container (invisible) -->
      <div id="recaptcha-container" class="hidden"></div>
      <!-- OTP Modal -->
      <app-otp [open]="otpOpen" (close)="otpOpen = false" (verify)="onOtpVerify($event)"></app-otp>
    </div>
  `,
  styles: []
})
export class ActorOnboardComponent {
  otpOpen = false;
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  errorMsg = '';
  private phoneConfirmation?: ConfirmationResult;

  form = this.fb.group({
    stageName: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    countryCode: ['+91', [Validators.required, Validators.pattern(/^\+[1-9]\d{0,3}$/)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{6,12}$/)]],
  });

  onNext() {
    if (this.form.invalid) return;
    this.errorMsg = '';
    const v = this.form.value as any;
    const cc = (v.countryCode || '').toString().trim();
    const num = (v.mobileNumber || '').toString().trim();
    const phoneDisplay = `${cc}-${num}`;
    this.auth.registerWithEmail({
      name: v.stageName ?? '',
      email: v.email ?? '',
      password: v.password ?? '',
      phone: phoneDisplay,
      location: v.location ?? '',
      role: 'actor',
    })
      .then(() =>{
        console.log("registering")
        this.router.navigateByUrl('/discover')
      })
      .catch((err) => {
        console.error(err);
        this.errorMsg = err?.message || 'Registration failed';
      });
  }

  onOtpVerify(code: string) {
    if (!this.phoneConfirmation) {
      this.errorMsg = 'No pending phone verification.';
      return;
    }
    const v = this.form.value as any;
    const cc = (v.countryCode || '').toString().trim();
    const num = (v.mobileNumber || '').toString().trim();
    const e164 = `${cc}${num}`;
    const profile = {
      role: 'actor' as const,
      name: v.stageName ?? '',
      location: v.location ?? '',
      mobile: e164,
      email: v.email ?? '',
    };

    this.auth.confirmPhoneSignup(this.phoneConfirmation, code, profile)
      .then(() => {
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", profile , code)
        this.otpOpen = false;
        this.router.navigateByUrl('/discover');
      })
      .catch((err) => {
        console.error(err);
        this.errorMsg = err?.message || 'Invalid OTP. Please try again.';
      });
  }
}
