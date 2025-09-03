import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-discover-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <!-- Left: Sidebar -->
        <aside class="rounded-2xl bg-black/40 ring-2 ring-white/10 border border-neutral-800 p-4">
          <h2 class="text-sm font-semibold text-neutral-300 mb-3">settings</h2>
          <nav class="space-y-1 text-sm">
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 ring-white/10 bg-white/5 text-neutral-200">account
              <div class="text-[11px] text-neutral-500">username, phone number, email, account type</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 ring-white/10 text-neutral-300 hover:bg-white/5">privacy & security
              <div class="text-[11px] text-neutral-500">visibility, password, activity status, 2fa, blocked users</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 ring-white/10 text-neutral-300 hover:bg-white/5">subscriptions
              <div class="text-[11px] text-neutral-500">manage subscription, plans, payments, history</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 ring-white/10 text-neutral-300 hover:bg-white/5">analytics
              <div class="text-[11px] text-neutral-500">profile views, reach, media library insights</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 ring-white/10 text-neutral-300 hover:bg-white/5">support & feedback
              <div class="text-[11px] text-neutral-500">help, bugs, feedback, contact</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 ring-white/10 text-neutral-300 hover:bg-white/5">legal
              <div class="text-[11px] text-neutral-500">terms & conditions, privacy policy, guidelines, about us</div>
            </button>
          </nav>
        </aside>

        <!-- Right: Account panel -->
        <section class="rounded-2xl bg-black/40 ring-2 ring-white/10 border border-neutral-800 p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-neutral-300">account</h2>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Username/email/mobile fields -->
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <button class="h-8 w-8 rounded-full grid place-items-center ring-1 ring-white/10 bg-white/5 text-neutral-300" aria-label="edit username">✎</button>
                <div class="flex-1 h-10 px-4 rounded-xl ring-1 ring-white/10 bg-white/5 text-neutral-400 grid place-items-center text-sm">username</div>
              </div>
              <div class="flex items-center gap-3">
                <button class="h-8 w-8 rounded-full grid place-items-center ring-1 ring-white/10 bg-white/5 text-neutral-300" aria-label="edit email">✎</button>
                <div class="flex-1 h-10 px-4 rounded-xl ring-1 ring-white/10 bg-white/5 text-neutral-400 grid place-items-center text-sm">email</div>
              </div>
              <div class="flex items-center gap-3">
                <button class="h-8 w-8 rounded-full grid place-items-center ring-1 ring-white/10 bg-white/5 text-neutral-300" aria-label="edit mobile">✎</button>
                <div class="flex-1 h-10 px-4 rounded-xl ring-1 ring-white/10 bg-white/5 text-neutral-400 grid place-items-center text-sm">mobile</div>
              </div>
            </div>

            <!-- Add account tiles -->
            <div class="space-y-3">
              <div class="text-sm text-neutral-300 mb-1">add account</div>
              <div class="grid grid-cols-2 gap-3">
                <button class="aspect-square rounded-xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition grid place-items-center">
                  <svg viewBox="0 0 24 24" class="h-10 w-10 text-neutral-300" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </button>
                <button class="aspect-square rounded-xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition grid place-items-center">
                  <svg viewBox="0 0 24 24" class="h-10 w-10 text-neutral-300" fill="currentColor"><path d="M12 5.5c-2.48 0-4.5 2.02-4.5 4.5S9.52 14.5 12 14.5 16.5 12.48 16.5 10 14.48 5.5 12 5.5zM4 19c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: []
})
export class SettingsComponent {}
