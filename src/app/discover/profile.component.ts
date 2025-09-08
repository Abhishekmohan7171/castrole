import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
 

@Component({
  selector: 'app-discover-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 md:py-6">
      <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 md:gap-8 lg:gap-10">
        <!-- Left: Profile card + media -->
        <section class="space-y-5">
          <!-- Profile card (matches compact dark card in frame) -->
          <div class="rounded-2xl bg-black/50 ring-2 ring-white/10 border border-neutral-800 p-5">
            <div class="flex items-start gap-4">
              <!-- circular avatar placeholder with ring -->
              <div class="relative h-20 w-20 sm:h-24 sm:w-24">
                <div class="absolute inset-0 rounded-full ring-1 ring-white/15"></div>
                <div class="absolute inset-2 rounded-full bg-white/5"></div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h1 class="text-lg sm:text-xl font-semibold text-neutral-100">m rahul</h1>
                  <span class="px-2 py-0.5 text-[11px] rounded-full ring-1 ring-white/10 bg-emerald-500/10 text-emerald-300">actor</span>
                  <!-- mini icons to the right of name -->
                  <button class="ml-2 h-6 w-6 grid place-items-center rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="play">
                    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-neutral-300"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                  </button>
                  <button class="h-6 w-6 grid place-items-center rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="edit" (click)="navigateToSettings()">
                    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-neutral-300"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>
                  </button>
                </div>
                <div class="mt-3 grid grid-cols-4 gap-2 text-[11px] text-neutral-300">
                  <div class="rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1 text-center">25 <span class="opacity-60">age</span></div>
                  <div class="rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1 text-center">male <span class="opacity-60">gender</span></div>
                  <div class="rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1 text-center">180cm <span class="opacity-60">height</span></div>
                  <div class="rounded-md bg-white/5 ring-1 ring-white/10 px-2 py-1 text-center">80kg <span class="opacity-60">weight</span></div>
                </div>
                <!-- fake waveform row -->
                <div class="mt-3 h-6 flex items-end gap-0.5 text-fuchsia-300/70">
                  <span class="block w-0.5 h-2 bg-current"></span>
                  <span class="block w-0.5 h-4 bg-current"></span>
                  <span class="block w-0.5 h-3 bg-current"></span>
                  <span class="block w-0.5 h-5 bg-current"></span>
                  <span class="block w-0.5 h-3 bg-current"></span>
                  <span class="block w-0.5 h-6 bg-current"></span>
                </div>
              </div>
              <!-- tiny action icons -->
              <div class="flex flex-col items-center gap-2 text-neutral-400">
                <button class="h-7 w-7 rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="options"></button>
                <button class="h-7 w-7 rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="play"></button>
              </div>
            </div>
          </div>

          <!-- Media tabs -->
          <div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 p-1">
              <button class="px-3 py-1.5 rounded-full text-xs"
                      [ngClass]="{ 'bg-white/10 text-neutral-100': mediaTab==='videos', 'text-neutral-400': mediaTab!=='videos' }"
                      (click)="mediaTab='videos'">videos</button>
              <button class="px-3 py-1.5 rounded-full text-xs"
                      [ngClass]="{ 'bg-white/10 text-neutral-100': mediaTab==='photos', 'text-neutral-400': mediaTab!=='photos' }"
                      (click)="mediaTab='photos'">photos</button>
            </div>

            <!-- Color tile grid, mimicking frame -->
            <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
              <div class="aspect-video rounded-lg ring-1 ring-white/10 bg-green-800/50 relative overflow-hidden hover:ring-white/20 transition-all duration-200 cursor-pointer">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide text-white/80">cassette</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 ring-white/10 bg-emerald-900/50 relative overflow-hidden hover:ring-white/20 transition-all duration-200 cursor-pointer">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide text-white/80">character reel</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 ring-white/10 bg-red-900/60 relative overflow-hidden hover:ring-white/20 transition-all duration-200 cursor-pointer">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide text-white/80">album</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 ring-white/10 bg-purple-900/50 hidden sm:block relative overflow-hidden hover:ring-white/20 transition-all duration-200 cursor-pointer">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide text-white/80">showreel</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 ring-white/10 bg-neutral-800/70 hidden sm:block hover:ring-white/20 transition-all duration-200 cursor-pointer"></div>
              <div class="aspect-video rounded-lg ring-1 ring-white/10 bg-neutral-700/60 hidden sm:block hover:ring-white/20 transition-all duration-200 cursor-pointer"></div>
            </div>

            <!-- Social links row -->
            <div class="mt-4">
              <div class="text-xs text-neutral-500 mb-2">social links</div>
              <div class="flex items-center gap-3 text-neutral-400">
                <a href="#" class="h-7 w-7 rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="link"></a>
                <a href="#" class="h-7 w-7 rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="link"></a>
                <a href="#" class="h-7 w-7 rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="link"></a>
                <a href="#" class="h-7 w-7 rounded-full ring-1 ring-white/10 bg-white/5 hover:bg-white/10" aria-label="link"></a>
              </div>
            </div>
          </div>
        </section>

        <!-- Right: Details -->
        <section class="space-y-4 sm:space-y-6">
          <div class="rounded-2xl bg-black/50 ring-2 ring-white/10 border border-neutral-800 p-4 sm:p-5 md:p-6 transition-all duration-300">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
              <div>
                <dt class="text-neutral-500 text-xs uppercase tracking-wide">location</dt>
                <dd class="text-neutral-200 text-sm">perumbavoor, ernakulam</dd>
              </div>
              <div>
                <dt class="text-neutral-500 text-xs uppercase tracking-wide">acting education</dt>
                <dd class="text-neutral-200 text-sm">xyz school of acting<br/>diploma in acting</dd>
                <dd><a class="text-fuchsia-300 text-xs hover:underline" href="#">view certificate</a></dd>
              </div>

              <div class="sm:col-span-2">
                <dt class="text-neutral-500 text-xs uppercase tracking-wide">experiences</dt>
                <dd class="mt-1 space-y-3 md:space-y-4">
                  <div class="p-2 sm:p-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                    <div class="text-neutral-200 text-sm font-medium">a journey within</div>
                    <div class="text-neutral-400 text-xs">supporting role | tv series | thriller | 2012</div>
                    <a class="text-fuchsia-300 text-xs hover:underline" href="https://www.linkforproject.com" target="_blank">www.linkforproject.com</a>
                  </div>
                  <div class="p-2 sm:p-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                    <div class="text-neutral-200 text-sm font-medium">city lights</div>
                    <div class="text-neutral-400 text-xs">lead role | film | comedy | 2020</div>
                    <a class="text-fuchsia-300 text-xs hover:underline" href="https://www.linkforproject.com" target="_blank">www.linkforproject.com</a>
                  </div>
                </dd>
              </div>

              <div>
                <dt class="text-neutral-500 text-xs uppercase tracking-wide mb-2">languages</dt>
                <dd class="text-neutral-200 text-sm space-y-2 mt-1">
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors duration-200">
                    <span>malayalam</span><span class="text-fuchsia-300">★★★★★</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors duration-200">
                    <span>english</span><span class="text-fuchsia-300">★★★★★</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors duration-200">
                    <span>hindi</span><span class="text-fuchsia-300">★★★★☆</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors duration-200">
                    <span>tamil</span><span class="text-fuchsia-300">★★★☆☆</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors duration-200">
                    <span>telugu</span><span class="text-fuchsia-300">★★☆☆☆</span>
                  </div>
                </dd>
              </div>
              <div>
                <dt class="text-neutral-500 text-xs uppercase tracking-wide mb-2">extra curricular</dt>
                <dd class="text-neutral-200 text-sm space-y-2 mt-1">
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors duration-200">
                    <span>singing</span><span class="text-fuchsia-300">★★★☆☆</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors duration-200">
                    <span>guitar</span><span class="text-fuchsia-300">★★★★★</span>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent {
  mediaTab: 'videos' | 'photos' = 'videos';
  
  constructor(private router: Router) {}
  
  navigateToSettings() {
    this.router.navigate(['/discover/settings']);
  }
}
