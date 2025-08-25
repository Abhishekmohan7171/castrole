import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Brand -->
      <h1 class="pt-16 pb-8 text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Card -->
      <div class="w-full max-w-xl rounded-3xl bg-neutral-900/60 border border-white/5 shadow-2xl shadow-black/60 px-8 py-10">
        <form class="space-y-5">
          <!-- Username -->
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <!-- user icon -->
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                <path d="M4.5 20.25a8.25 8.25 0 0 1 15 0" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="username"
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
              class="w-full bg-neutral-800/80 text-neutral-200 placeholder-neutral-500 rounded-full pl-12 pr-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/50 transition"
            />
          </div>

          <div class="flex justify-end -mt-1">
            <a href="#" class="text-xs text-neutral-500 hover:text-neutral-300">forgot password?</a>
          </div>

          <button type="submit" class="w-full rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-neutral-100 py-3 font-medium ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] transition">
            sign in
          </button>
        </form>
      </div>

      <!-- Register link -->
      <div class="mt-6 text-sm text-neutral-500">
        new? <a href="#" class="text-neutral-300 font-semibold hover:text-white">register now</a>
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
          <button type="button" class="group rounded-full ring-1 ring-white/10 bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-200 px-6 py-4 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.06)] transition">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 text-sm font-bold">G</span>
            <span class="tracking-wide">continue with google</span>
          </button>
          <button type="button" class="group rounded-full ring-1 ring-white/10 bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-200 px-6 py-4 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.06)] transition">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 text-base"></span>
            <span class="tracking-wide">continue with apple</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {}
