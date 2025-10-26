import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold text-white mb-6">Legal</h2>
      <div class="space-y-4">
        <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
          <span class="text-white">terms & conditions</span>
          <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
          <span class="text-white">privacy policy</span>
          <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
          <span class="text-white">guidelines</span>
          <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
          <span class="text-white">about us</span>
          <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class LegalSectionComponent {}
