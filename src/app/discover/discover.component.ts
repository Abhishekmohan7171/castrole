import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-black text-neutral-200">
      <!-- Top bar -->
      <header class="sticky top-0 z-40 bg-black/70 backdrop-blur">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <a routerLink="/" class="text-3xl font-black tracking-wider text-neutral-300 select-none">castrole</a>
          <nav class="flex items-center gap-8 text-sm">
            <a routerLink="/discover" routerLinkActive="text-fuchsia-300" [routerLinkActiveOptions]="{ exact: true }" class="text-neutral-500 hover:text-neutral-300 transition">discover</a>
            <a routerLink="/discover/upload" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition">upload</a>
            <a routerLink="/discover/chat" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition">chat</a>
            <a routerLink="/discover/profile" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition">profile</a>
            <a routerLink="/discover/settings" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition">settings</a>
          </nav>
        </div>
      </header>

      <!-- Child content -->
      <main class="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <router-outlet />
      </main>
    </div>
  `,
  styles: []
})
export class DiscoverComponent {}
