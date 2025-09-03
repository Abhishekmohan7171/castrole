import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-discover-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="text-neutral-400">
      <h2 class="text-xl font-semibold text-neutral-200 mb-4">Upload</h2>
      <p class="text-sm">Coming soon: upload your reels, headshots, or project briefs.</p>
    </section>
  `,
  styles: []
})
export class UploadComponent {}
