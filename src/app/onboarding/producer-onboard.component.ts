import { Component } from '@angular/core';
import { OtpComponent } from '../common-components/otp/otp.component';

@Component({
  selector: 'app-producer-onboard',
  standalone: true,
  imports: [OtpComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Brand -->
      <h1 class="pt-16 pb-10 text-5xl sm:text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl bg-neutral-900/60 border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <form class="space-y-5" autocomplete="off" novalidate>
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
              name="productionHouse"
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
              name="location"
              placeholder="location"
              aria-label="location"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          <!-- Mobile number -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11l-.9.9a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92Z" />
              </svg>
            </span>
            <input
              type="tel"
              name="mobile"
              inputmode="numeric"
              placeholder="mobile number"
              aria-label="mobile number"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          <button type="button" (click)="otpOpen = true" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            next
          </button>
        </form>
      </div>
      <!-- OTP Modal -->
      <app-otp [open]="otpOpen" (close)="otpOpen = false" (verify)="onOtpVerify($event)"></app-otp>
    </div>
  `,
  styles: []
})
export class ProducerOnboardComponent {
  otpOpen = false;

  onOtpVerify(code: string) {
    this.otpOpen = false;
    // TODO: implement navigation after verification
  }
}
