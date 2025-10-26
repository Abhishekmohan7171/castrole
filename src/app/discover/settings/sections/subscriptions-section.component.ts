import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriptions-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold text-white mb-6">Subscriptions</h2>
      
      <!-- Available Plans Section -->
      <div class="space-y-6">
        <h3 class="text-sm font-medium text-neutral-400 uppercase tracking-wide">available plans</h3>
        
        <!-- Single Card with All Features -->
        <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6 space-y-6">
          <!-- High Visibility -->
          <div>
            <h4 class="text-lg font-semibold text-white mb-2">High Visibility</h4>
            <p class="text-sm text-neutral-400 leading-relaxed">
              Get featured at the top of searches and casting feeds to maximize your reach.
            </p>
          </div>

          <!-- Upload Limits -->
          <div>
            <h4 class="text-lg font-semibold text-white mb-2">Upload up to 10 Audition Reels</h4>
            <p class="text-sm text-neutral-400 leading-relaxed">
              Showcase your full range with multiple performance reels.
            </p>
          </div>

          <!-- Ad-Free Experience -->
          <div>
            <h4 class="text-lg font-semibold text-white mb-2">Ad-Free Experience</h4>
            <p class="text-sm text-neutral-400 leading-relaxed">
              Enjoy a distraction-free browsing and uploading experience.
            </p>
          </div>

          <!-- View Full Analytics -->
          <div>
            <h4 class="text-lg font-semibold text-white mb-2">View Full Analytics</h4>
            <p class="text-sm text-neutral-400 leading-relaxed">
              Track profile visits, reel performance, and casting insights in real time.
            </p>
          </div>
        </div>

        <!-- Pricing Buttons -->
        <div class="flex gap-4">
          <button class="flex-1 py-4 px-6 bg-purple-600/20 border border-purple-500/50 rounded-xl text-purple-300 hover:bg-purple-600/30 transition-all font-medium">
            monthly ₹222
          </button>
          <button class="flex-1 py-4 px-6 bg-purple-600/20 border border-purple-500/50 rounded-xl text-purple-300 hover:bg-purple-600/30 transition-all font-medium">
            yearly ₹2222
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SubscriptionsSectionComponent {}
