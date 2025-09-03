import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Brand -->
      <h1 class="pt-16 pb-8 text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl bg-neutral-900/60 border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <form class="space-y-5" [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <!-- mail icon -->
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                <path d="m22 8-10 7L2 8" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="email"
              autocomplete="email"
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
              type="password"
              placeholder="password"
              autocomplete="new-password"
              formControlName="password"
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>

          <!-- Error -->
          <p *ngIf="error" class="text-sm text-red-400">{{ error }}</p>

          <button type="submit" [disabled]="loading || form.invalid" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            create account
          </button>
        </form>
      </div>

      <!-- Login link -->
      <div class="mt-6 text-sm text-neutral-500">
        already have an account? <a routerLink="/login" class="text-neutral-300 font-semibold hover:text-white">sign in</a>
      </div>
    </div>
  `,
  styles: []
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.loading = true;
    this.error = '';
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      await this.router.navigateByUrl('/login');
    } catch (e: any) {
      const msg = e?.message || 'Failed to create account';
      this.error = msg;
      console.error('[signup] error', e);
    } finally {
      this.loading = false;
    }
  }
}
