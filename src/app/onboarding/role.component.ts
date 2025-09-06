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
            class="group relative aspect-[4/3] flex flex-col items-center justify-center rounded-[28px] p-[1px] transition"
            aria-label="Continue as Actor"
          >
            <!-- Outer neon border gradient -->
            <div class="absolute inset-0 rounded-[28px] opacity-25 group-hover:opacity-60 transition duration-500" style="background: radial-gradient(60% 60% at 50% 0%, rgba(16,185,129,0.35), rgba(16,185,129,0) 60%); filter: drop-shadow(0 0 24px rgba(16,185,129,0.35));" aria-hidden="true"></div>

            <!-- Glass panel with subtle border -->
            <div class="absolute inset-0 rounded-[28px] bg-[rgb(12,12,12)]/60 backdrop-blur-[2px] ring-1 ring-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"></div>

            <!-- Inner stroke / edge highlight -->
            <div class="absolute inset-0 rounded-[28px] pointer-events-none" style="background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000); -webkit-mask-composite: xor; mask-composite: exclude; padding: 1px;"></div>

            <!-- Soft inner glow -->
            <div class="absolute inset-0 rounded-[28px] pointer-events-none" style="box-shadow: inset 0 1px 20px rgba(255,255,255,0.06), inset 0 -40px 120px rgba(0,0,0,0.6);"></div>

            <!-- Sheen highlight -->
            <div class="absolute -top-8 -left-10 h-32 w-40 rotate-[-20deg] rounded-2xl opacity-0 group-hover:opacity-60 blur-lg transition duration-700" style="background: radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.25), rgba(255,255,255,0)); animation: sheen 2.2s ease-in-out infinite;" aria-hidden="true"></div>

            <!-- Content -->
            <div class="relative z-[1] flex flex-col items-center justify-center gap-6 px-8 sm:px-10 py-6 sm:py-8">
              <!-- simplified actor silhouette -->
               <img src="assets/actor.png" alt="Actor icon" class="h-24 w-auto sm:h-28 md:h-32 lg:h-40 max-h-[60%] object-contain pointer-events-none select-none opacity-85 group-hover:opacity-100 transition duration-300 ease-out group-hover:scale-[1.03] drop-shadow-[0_10px_25px_rgba(0,0,0,0.55)]" />
              <!-- <svg class="h-20 w-20 sm:h-24 sm:w-24 text-neutral-400 group-hover:text-emerald-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="6.5" r="3" />
                <path d="M12 10v4" />
                <path d="M8.5 22c.7-3.2 2.6-5.2 3.5-5.2s2.8 2 3.5 5.2" />
                <path d="M6.5 13.2c2.2 0 3.2-2 5.5-2s3.3 2 5.5 2" />
              </svg> -->
              <span class="text-lg sm:text-xl font-semibold tracking-wide">Actor</span>
            </div>
          </a>

          <!-- Producer card -->
          <a
            routerLink="/onboarding/producer"
            class="group relative aspect-[4/3] flex flex-col items-center justify-center rounded-[28px] p-[1px] transition"
            aria-label="Continue as Producer"
          >
            <!-- Outer neon border gradient -->
            <div class="absolute inset-0 rounded-[28px] opacity-25 group-hover:opacity-60 transition duration-500" style="background: radial-gradient(60% 60% at 50% 0%, rgba(99,102,241,0.35), rgba(99,102,241,0) 60%); filter: drop-shadow(0 0 24px rgba(99,102,241,0.35));" aria-hidden="true"></div>

            <!-- Glass panel with subtle border -->
            <div class="absolute inset-0 rounded-[28px] bg-[rgb(12,12,12)]/60 backdrop-blur-[2px] ring-1 ring-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"></div>

            <!-- Inner stroke / edge highlight -->
            <div class="absolute inset-0 rounded-[28px] pointer-events-none" style="background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000); -webkit-mask-composite: xor; mask-composite: exclude; padding: 1px;"></div>

            <!-- Soft inner glow -->
            <div class="absolute inset-0 rounded-[28px] pointer-events-none" style="box-shadow: inset 0 1px 20px rgba(255,255,255,0.06), inset 0 -40px 120px rgba(0,0,0,0.6);"></div>

            <!-- Sheen highlight -->
            <div class="absolute -top-8 -left-10 h-32 w-40 rotate-[-20deg] rounded-2xl opacity-0 group-hover:opacity-60 blur-lg transition duration-700" style="background: radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.25), rgba(255,255,255,0)); animation: sheen 2.2s ease-in-out infinite;" aria-hidden="true"></div>

            <!-- Content -->
            <div class="relative z-[1] flex flex-col items-center justify-center gap-6 px-8 sm:px-10 py-6 sm:py-8">
              <!-- simplified director chair icon -->
              <img src="assets/producer.png" alt="Producer icon" class="h-24 w-auto sm:h-28 md:h-32 lg:h-40 max-h-[60%] object-contain pointer-events-none select-none opacity-85 group-hover:opacity-100 transition duration-300 ease-out group-hover:scale-[1.03] drop-shadow-[0_10px_25px_rgba(0,0,0,0.55)]" />
              <!-- <svg class="h-20 w-20 sm:h-24 sm:w-24 text-neutral-400 group-hover:text-indigo-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="5" y="4" width="14" height="5" rx="1" />
                <path d="M7 9l-2 11" />
                <path d="M17 9l2 11" />
                <path d="M4 15h16" />
                <path d="M6 12l12-3" />
              </svg> -->
              <span class="text-lg sm:text-xl font-semibold tracking-wide">Producer</span>
            </div>
          </a>
        </div>

        <!-- Hint / helper -->
        <p class="text-center mt-10 text-sm text-neutral-500">Choose your role to continue</p>
      </div>
    </div>
  `,
  styles: [
    `@keyframes sheen { 0% { transform: translateX(-10%) rotate(-20deg); } 50% { transform: translateX(10%) rotate(-20deg); } 100% { transform: translateX(-10%) rotate(-20deg); } }`
  ]
})
export class RoleComponent {

}
