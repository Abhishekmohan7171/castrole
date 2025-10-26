import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold text-white mb-6">Support & Feedback</h2>
      
      <div class="space-y-6">
        <!-- Subject Input -->
        <div>
          <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">subject</label>
          <input
            type="text"
            placeholder="Enter subject"
            class="w-full px-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          />
        </div>

        <!-- Message Textarea -->
        <div>
          <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">message</label>
          <textarea
            rows="8"
            placeholder="Describe your issue or feedback..."
            class="w-full px-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
          ></textarea>
        </div>

        <!-- Send Button -->
        <div class="flex justify-end">
          <button class="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-all">
            send
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SupportSectionComponent {}
