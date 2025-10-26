import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold text-white mb-6">Analytics</h2>
      <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-8 text-center">
        <p class="text-neutral-400">Analytics dashboard coming soon</p>
      </div>
    </div>
  `,
})
export class AnalyticsSectionComponent {}
