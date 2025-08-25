import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-black text-neutral-300 flex flex-col items-center">
      <!-- Brand -->
      <h1 class="pt-16 pb-12 text-5xl sm:text-6xl md:text-7xl font-black tracking-wider text-neutral-400 select-none">castrole</h1>

      <!-- Cards container -->
      <div class="w-full max-w-5xl px-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <!-- Actor card -->
          <a
            routerLink="/onboarding/actor"
            class="group relative rounded-3xl bg-neutral-900/60 border border-white/5 p-10 flex flex-col items-center justify-center aspect-[4/3] shadow-2xl shadow-black/60 ring-1 ring-white/10 hover:ring-emerald-400/40 transition"
            aria-label="Continue as Actor"
          >
            <div class="absolute inset-0 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] opacity-0 group-hover:opacity-100 transition" aria-hidden="true"></div>
            <!-- simplified actor silhouette -->
            <svg class="h-20 w-20 sm:h-24 sm:w-24 text-neutral-400 group-hover:text-emerald-300 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="6.5" r="3" />
              <path d="M12 10v4" />
              <path d="M8.5 22c.7-3.2 2.6-5.2 3.5-5.2s2.8 2 3.5 5.2" />
              <path d="M6.5 13.2c2.2 0 3.2-2 5.5-2s3.3 2 5.5 2" />
            </svg>
            <span class="mt-6 text-lg sm:text-xl font-semibold tracking-wide">Actor</span>
          </a>

          <!-- Producer card -->
          <a
            routerLink="/onboarding/producer"
            class="group relative rounded-3xl bg-neutral-900/60 border border-white/5 p-10 flex flex-col items-center justify-center aspect-[4/3] shadow-2xl shadow-black/60 ring-1 ring-white/10 hover:ring-indigo-400/40 transition"
            aria-label="Continue as Producer"
          >
            <div class="absolute inset-0 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.15)] opacity-0 group-hover:opacity-100 transition" aria-hidden="true"></div>
            <!-- simplified director chair icon -->
            <svg class="h-20 w-20 sm:h-24 sm:w-24 text-neutral-400 group-hover:text-indigo-300 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="5" y="4" width="14" height="5" rx="1" />
              <path d="M7 9l-2 11" />
              <path d="M17 9l2 11" />
              <path d="M4 15h16" />
              <path d="M6 12l12-3" />
            </svg>
            <span class="mt-6 text-lg sm:text-xl font-semibold tracking-wide">Producer</span>
          </a>
        </div>

        <!-- Hint / helper -->
        <p class="text-center mt-10 text-sm text-neutral-500">Choose your role to continue</p>
      </div>
    </div>
  `,
  styles: []
})
export class RoleComponent {

}
