import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold text-white mb-6">Account Settings</h2>
      <div class="space-y-6">
        <!-- Email -->
        <div>
          <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">email</label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <input
              type="email"
              value="user@example.com"
              readonly
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="swami vivekananda institute of film production"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">password</label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <input
              type="password"
              value="••••••••••••"
              readonly
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        <!-- Mobile -->
        <div>
          <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">mobile</label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <input
              type="tel"
              value="+91 9876543210"
              readonly
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        <!-- Add Account -->
        @if (!isActor()) {
        <div class="pt-4">
          <button class="w-full py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-neutral-400 hover:bg-neutral-800/80 hover:text-white transition-all flex items-center justify-center gap-2">
            <span class="text-lg">add account</span>
          </button>
        </div>
        }
      </div>
    </div>
  `,
})
export class AccountSectionComponent {
  isActor = signal(true);
}
