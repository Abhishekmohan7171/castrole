import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoaderComponent } from '../common-components/loader/loader.component';
import { OtpComponent } from '../common-components/otp/otp.component';
import type { ConfirmationResult } from 'firebase/auth';

@Component({
  selector: 'app-actor-onboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, LoaderComponent, OtpComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Loader -->
      <app-loader [show]="loading" message="Creating your account..."></app-loader>
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
            <div class="flex gap-2 items-center">
              <select formControlName="countryCode" aria-label="country code" class="w-36 sm:w-40 bg-neutral-800/80 text-neutral-200 rounded-full px-3 py-3 ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 outline-none">
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
                  class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
                />
              </div>
              <button type="button" (click)="onVerifyPhone()"
                      class="shrink-0 rounded-full px-4 py-2 bg-neutral-100/10 hover:bg-neutral-100/20 text-neutral-100 ring-1 ring-white/10"
                      [disabled]="sendingOtp || !form.get('countryCode')?.valid || !form.get('mobileNumber')?.valid">
                {{ sendingOtp ? 'Sending…' : 'Verify' }}
              </button>
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

      <!-- Use a unique reCAPTCHA container for actor to avoid clashes -->
      <div id="recaptcha-container-actor" class="mt-4"></div>
      <!-- Inline OTP Modal kept available but not auto-opened once routing is used -->
      <app-otp [open]="otpOpen" [phone]="phoneDisplay" (close)="otpOpen = false" (verify)="onOtpVerify($event)" (resend)="onResendOtp()"></app-otp>
    </div>
  `,
  styles: []
})
export class ActorOnboardComponent {
  loading = false;
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  errorMsg = '';
  otpOpen = false;
  private phoneConfirmation?: ConfirmationResult;
  isPhoneVerified = false;
  private phoneE164 = '';
  phoneDisplay = '';
  sendingOtp = false;

  countryCodes: Array<{ name: string; dialCode: string; flag: string }> = [];
  // Location data and suggestions
  private allLocations: Array<{ district: string; state: string }> = [];
  locationSuggestions: Array<{ district: string; state: string }> = [];

  form = this.fb.group({
    stageName: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    countryCode: ['+91', [Validators.required, Validators.pattern(/^\+\d[\d-]*$/)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{6,12}$/)]],
  });

  constructor() {
    // Read verified flag when returning from routed OTP page
    this.route.queryParamMap.subscribe((qp) => {
      if (qp.get('verified') === '1') {
        this.isPhoneVerified = true;
        this.otpOpen = false;
        this.errorMsg = '';
      }
    });

    // Load country codes from assets
    this.http
      .get<Array<{ name: string; dialCode: string; flag: string }>>('assets/json/country-code.json')
      .subscribe({
        next: (data) => {
          this.countryCodes = data ?? [];
          // If current value isn't in the list, keep as-is; otherwise nothing to do
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

  private buildPhones() {
    const v = this.form.value as any;
    const cc = (v.countryCode || '').toString().trim().replace(/[^+\d]/g, '');
    const num = (v.mobileNumber || '').toString().trim();
    this.phoneE164 = `${cc}${num}`;
    this.phoneDisplay = `${cc}-${num}`;
    return { cc, num };
  }

  async onVerifyPhone() {
    if (this.sendingOtp) return;
    this.errorMsg = '';
    const { cc, num } = this.buildPhones();
    if (!cc || !num) { this.errorMsg = 'Enter country code and mobile number.'; return; }
    this.sendingOtp = true;
    try {
      this.phoneConfirmation = await this.auth.startPhoneVerification(this.phoneE164, 'recaptcha-container-actor', this.phoneDisplay);
      // Route-only flow to OTP page after successful OTP send
      this.router.navigate(['/onboarding/actor/otp']);
    } catch (e: any) {
      const msg = e?.message || '';
      if (e?.code === 'auth/captcha-visible-required') {
        this.errorMsg = 'Please complete the captcha below, then tap Verify again.';
      } else if (e?.code === 'auth/too-many-requests') {
        this.errorMsg = 'Too many attempts. Please wait a minute before retrying.';
      } else if (e?.code === 'auth/invalid-app-credential' || e?.code === 'auth/captcha-check-failed') {
        this.errorMsg = 'Captcha failed. Ensure blockers are disabled and your domain is authorized.';
      } else {
        this.errorMsg = msg || 'Failed to start phone verification.';
      }
      // Optional: include code for local debugging during dev builds
      if (e?.code && !this.isPhoneVerified) {
        this.errorMsg += ` (code: ${e.code})`;
      }
    } finally {
      this.sendingOtp = false;
    }
  }

  async onResendOtp() {
    this.errorMsg = '';
    const { cc, num } = this.buildPhones();
    if (!cc || !num) { this.errorMsg = 'Enter country code and mobile number.'; return; }
    try {
      this.phoneConfirmation = await this.auth.startPhoneVerification(this.phoneE164, 'recaptcha-container-actor', this.phoneDisplay);
    } catch (e: any) {
      this.errorMsg = e?.message || 'Failed to resend OTP.';
    }
  }

  async onOtpVerify(code: string) {
    if (!this.phoneConfirmation) { this.errorMsg = 'No pending phone verification.'; return; }
    try {
      await this.auth.confirmPhoneVerification(this.phoneConfirmation, code, this.phoneDisplay);
      this.isPhoneVerified = true;
      this.otpOpen = false;
    } catch (e: any) {
      this.errorMsg = e?.message || 'Invalid OTP. Please try again.';
    }
  }

  onNext() {
    if (this.form.invalid || !this.isPhoneVerified) { this.errorMsg = 'Please verify your phone number.'; return; }
    this.errorMsg = '';
    this.loading = true;
    const v = this.form.value as any;
    // Normalize country code to remove hyphens, e.g., +1-268 -> +1268
    const cc = (v.countryCode || '').toString().trim().replace(/-/g, '');
    const num = (v.mobileNumber || '').toString().trim();
    const phoneDisplay = `${cc}-${num}`;
    const current = this.auth.getCurrentUser();
    const commonParams = {
      name: v.stageName ?? '',
      email: v.email ?? '',
      phone: phoneDisplay,
      location: v.location ?? '',
      role: 'actor',
    };

    // If the user came from Google/Apple sign-in, they are already authenticated.
    // In that case, LINK email/password to that provider account and upsert profile.
    if (current) {
      this.auth.onboardProviderUser({
        ...commonParams,
        password: v.password ?? '',
      })
        .then(() => {
          this.router.navigateByUrl('/discover');
        })
        .catch((err: any) => {
          this.errorMsg = err?.message || 'Onboarding failed';
        })
        .finally(() => {
          this.loading = false;
        });
    } else {
      // Fresh email/password registration path
      this.auth
        .registerWithEmail({
          ...commonParams,
          password: v.password ?? '',
        })
        .then(() => {
          this.router.navigateByUrl('/discover');
        })
        .catch((err: any) => {
          this.errorMsg = err?.message || 'Registration failed';
        })
        .finally(() => {
          this.loading = false;
        });
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
