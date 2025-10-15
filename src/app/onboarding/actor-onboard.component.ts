import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoaderComponent } from '../common-components/loader/loader.component';

@Component({
  selector: 'app-actor-onboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, LoaderComponent],
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
              [type]="showPassword ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
              placeholder="password"
              aria-label="password"
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

          <!-- Mobile number (country code + number) -->
          <div class="relative">
            <div class="flex gap-2">
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
            </div>
          </div>

          <button type="button" [disabled]="form.invalid" (click)="onNext()" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            next
          </button>
        </form>
      </div>
      
    </div>
  `,
  styles: []
})
export class ActorOnboardComponent {
  loading = false;
  showPassword = false;
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  errorMsg = '';

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
    // Load country codes from assets
    this.http
      .get<Array<{ name: string; dialCode: string; flag: string }>>('assets/json/country-code.json')
      .subscribe({
        next: (data) => {
          this.countryCodes = data ?? [];
          // If current value isn't in the list, keep as-is; otherwise nothing to do
        },
        error: (err) => {
          console.error('Failed to load country codes', err);
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
        error: (err) => {
          console.error('Failed to load locations', err);
          this.allLocations = [];
          this.locationSuggestions = [];
        },
      });
  }

  onNext() {
    if (this.form.invalid) return;
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
        .catch((err) => {
          console.error(err);
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
          console.error(err);
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
