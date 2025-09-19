import { Component, inject } from '@angular/core';
import { OtpComponent } from '../common-components/otp/otp.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoaderComponent } from '../common-components/loader/loader.component';
import type { ConfirmationResult } from 'firebase/auth';

@Component({
  selector: 'app-producer-onboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, OtpComponent, LoaderComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Loader -->
      <app-loader [show]="loading" message="Creating your account..."></app-loader>
      <!-- Brand -->
      <h1 class="pt-16 pb-10 text-5xl sm:text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <form class="space-y-5" [formGroup]="form" autocomplete="off" novalidate>
          <!-- Production house -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 10l9-6 9 6" />
                <path d="M4 10v10h16V10" />
                <path d="M9 21V12h6v9" />
              </svg>
            </span>
            <input
              type="text"
              formControlName="productionHouse"
              placeholder="production house"
              aria-label="production house"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 transition"
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
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 transition"
            />
            <!-- Location suggestions -->
            <div *ngIf="locationSuggestions.length && (form.get('location')?.value || '').length > 0" class="absolute left-0 right-0 top-full mt-2 z-20">
              <div class="bg-neutral-900/95 backdrop-blur rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                <ul class="max-h-60 overflow-auto divide-y divide-white/5">
                  <li *ngFor="let s of locationSuggestions" (click)="onSelectLocationSuggestion(s)" class="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center justify-between">
                    <span class="text-neutral-200">{{ s.district }}</span>
                    <span class="text-neutral-400 text-sm">{{ s.state }}</span>
                  </li>
                </ul>
              </div>
            </div>
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
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 transition"
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
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          <!-- Mobile number (country code + number) -->
          <div class="relative">
            <div class="flex gap-2 items-center">
              <select formControlName="countryCode" aria-label="country code" class="w-36 sm:w-40 bg-neutral-800/80 text-neutral-200 rounded-full px-3 py-3 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 outline-none">
                <option *ngFor="let c of countryCodes" [value]="c.dialCode">
                  {{ c.flag }} {{ c.dialCode }} {{ c.name }}
                </option>
              </select>
              <div class="relative flex-1">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11l-.9.9a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" />
                  </svg>
                </span>
                <input
                  type="tel"
                  formControlName="mobileNumber"
                  inputmode="numeric"
                  placeholder="mobile number"
                  aria-label="mobile number"
                  class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 transition"
                />
              </div>
              <button type="button" (click)="onVerifyPhone()" class="shrink-0 rounded-full px-4 py-2 bg-neutral-100/10 hover:bg-neutral-100/20 text-neutral-100 ring-1 ring-white/10">Verify</button>
              <span *ngIf="isPhoneVerified" class="ml-2 inline-flex items-center gap-1 text-emerald-400 text-sm">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                Verified
              </span>
            </div>
            <p *ngIf="errorMsg" class="mt-2 text-sm text-red-400">{{ errorMsg }}</p>
          </div>

          <button type="button" [disabled]="form.invalid || !isPhoneVerified || loading" (click)="onNext()" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            next
          </button>
        </form>
      </div>
      <!-- reCAPTCHA container (invisible) required for phone auth -->
      <div id="recaptcha-container" class="hidden"></div>
      <!-- OTP Modal -->
      <app-otp [open]="otpOpen" [phone]="phoneDisplay" (close)="otpOpen = false" (verify)="onOtpVerify($event)"></app-otp>
    </div>
  `,
  styles: []
})
export class ProducerOnboardComponent {
  otpOpen = false;
  loading = false;
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  errorMsg = '';
  private phoneConfirmation?: ConfirmationResult;
  isPhoneVerified = false;
  private phoneE164 = '';
  phoneDisplay = '';

  countryCodes: Array<{ name: string; dialCode: string; flag: string }> = [];
  // Location data and suggestions
  private allLocations: Array<{ district: string; state: string }> = [];
  locationSuggestions: Array<{ district: string; state: string }> = [];

  form = this.fb.group({
    productionHouse: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    countryCode: ['+91', [Validators.required, Validators.pattern(/^\+\d[\d-]*$/)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{6,12}$/)]],
  });

  constructor() {
    // Load country codes from assets
    this.http
      .get<Array<{ name: string; dialCode: string; flag: string }>>('assets/json/country-code.json')
      .subscribe({
        next: (data) => {
          this.countryCodes = data ?? [];
        },
        error: () => {
          this.countryCodes = [];
        },
      });

    // Load processed locations for suggestions
    this.http
      .get<Array<{ state: string; districts: string[] }>>('assets/json/processed-locations.json')
      .subscribe({
        next: (data) => {
          const flat: Array<{ district: string; state: string }> = [];
          (data ?? []).forEach((s) => {
            (s.districts ?? []).forEach((d) => flat.push({ district: d, state: s.state }));
          });
          this.allLocations = flat;
          // Initialize suggestions based on current value
          this.updateLocationSuggestions((this.form.get('location')?.value || '').toString());
          // Subscribe to changes for live suggestions
          this.form.get('location')?.valueChanges.subscribe((val) => {
            this.updateLocationSuggestions((val || '').toString());
          });
        },
        error: () => {
          this.allLocations = [];
          this.locationSuggestions = [];
        },
      });
  }

  async onVerifyPhone() {
    this.errorMsg = '';
    const v = this.form.value as any;
    const cc = (v.countryCode || '').toString().trim().replace(/[^+\d]/g, '');
    const num = (v.mobileNumber || '').toString().trim();
    if (!cc || !num) { this.errorMsg = 'Enter country code and mobile number.'; return; }
    this.phoneE164 = `${cc}${num}`;
    this.phoneDisplay = `${cc}-${num}`;
    try {
      this.phoneConfirmation = await this.auth.startPhoneVerification(this.phoneE164, 'recaptcha-container');
      this.otpOpen = true;
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to start phone verification.';
    }
  }

  onNext() {
    if (this.form.invalid || !this.isPhoneVerified) return;
    this.errorMsg = '';
    this.loading = true;
    const v = this.form.value as any;
    // Normalize country code to remove hyphens, e.g., +1-268 -> +1268
    const cc = (v.countryCode || '').toString().trim().replace(/-/g, '');
    const num = (v.mobileNumber || '').toString().trim();
    const phoneDisplay = `${cc}-${num}`;
    const current = this.auth.getCurrentUser();
    const commonParams = {
      name: v.productionHouse ?? '',
      email: v.email ?? '',
      phone: phoneDisplay,
      location: v.location ?? '',
      role: 'producer',
    };

    if (current) {
      // Provider user is already authenticated: link email/password and upsert profile
      this.auth.onboardProviderUser({
        ...commonParams,
        password: v.password ?? '',
      })
        .then(() => this.router.navigateByUrl('/discover'))
        .catch((err: any) => {
          this.errorMsg = err?.message || 'Onboarding failed';
        })
        .finally(() => {
          this.loading = false;
        });
    } else {
      // Fresh email/password registration path
      this.auth.registerWithEmail({
        ...commonParams,
        password: v.password ?? '',
      })
        .then(() => this.router.navigateByUrl('/discover'))
        .catch((err: any) => {
          this.errorMsg = err?.message || 'Registration failed';
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  async onOtpVerify(code: string) {
    if (!this.phoneConfirmation) { this.errorMsg = 'No pending verification.'; return; }
    try {
      await this.auth.confirmPhoneVerification(this.phoneConfirmation, code, this.phoneDisplay);
      this.isPhoneVerified = true;
      this.otpOpen = false;
    } catch (e: any) {
      this.errorMsg = e?.message || 'Invalid OTP. Please try again.';
    }
  }

  private updateLocationSuggestions(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.locationSuggestions = [];
      return;
    }
    this.locationSuggestions = this.allLocations
      .filter((x) => x.district.toLowerCase().includes(q) || x.state.toLowerCase().includes(q))
      .slice(0, 10);
  }

  onSelectLocationSuggestion(s: { district: string; state: string }) {
    this.form.get('location')?.setValue(`${s.district}, ${s.state}`);
    this.locationSuggestions = [];
  }
}
