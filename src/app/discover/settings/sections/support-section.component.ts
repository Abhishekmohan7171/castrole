import { Component, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-support-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="space-y-2">
        <div
          class="text-xs font-medium uppercase tracking-wide"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Support & Feedback
        </div>
        <p
          class="text-sm"
          [ngClass]="{
            'text-purple-200/70': isActor(),
            'text-neutral-300': !isActor()
          }"
        >
          Have a question, found a bug, or want to share feedback? We're
          here to help!
        </p>
      </div>

      <!-- Support Form -->
      <form (ngSubmit)="onSubmitSupportForm()" class="space-y-6">
        <!-- Subject Field -->
        <div class="space-y-2">
          <label
            for="supportSubject"
            class="text-sm font-medium"
            [ngClass]="{
              'text-purple-200/80': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            Subject *
          </label>
          <input
            id="supportSubject"
            type="text"
            [(ngModel)]="localSupportSubject"
            name="supportSubject"
            placeholder="Brief description of your issue or feedback"
            required
            class="w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
            [ngClass]="{
              'bg-purple-950/20 border-purple-900/30 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-500 focus:ring-purple-500/20':
                isActor(),
              'bg-black/20 border-neutral-700 text-neutral-200 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-neutral-500/20':
                !isActor()
            }"
          />
        </div>

        <!-- Concern/Description Field -->
        <div class="space-y-2">
          <label
            for="supportConcern"
            class="text-sm font-medium"
            [ngClass]="{
              'text-purple-200/80': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            Describe your concern *
          </label>
          <textarea
            id="supportConcern"
            [(ngModel)]="localSupportConcern"
            name="supportConcern"
            placeholder="Please provide as much detail as possible to help us understand and address your concern..."
            rows="6"
            required
            class="w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
            [ngClass]="{
              'bg-purple-950/20 border-purple-900/30 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-500 focus:ring-purple-500/20':
                isActor(),
              'bg-black/20 border-neutral-700 text-neutral-200 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-neutral-500/20':
                !isActor()
            }"
          ></textarea>
          <p
            class="text-xs"
            [ngClass]="{
              'text-purple-300/50': isActor(),
              'text-neutral-400': !isActor()
            }"
          >
            Include steps to reproduce if reporting a bug, or specific
            suggestions if providing feedback.
          </p>
        </div>

        <!-- Submit Button -->
        <div class="pt-4">
          <button
            type="submit"
            [disabled]="
              !localSupportSubject().trim() ||
              !localSupportConcern().trim() ||
              isSubmittingSupport()
            "
            class="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            [ngClass]="{
              'bg-purple-600 hover:bg-purple-700 text-white disabled:hover:bg-purple-600':
                isActor(),
              'bg-neutral-600 hover:bg-neutral-700 text-white disabled:hover:bg-neutral-600':
                !isActor()
            }"
          >
            @if (isSubmittingSupport()) {
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </div>
            } @else { Submit Feedback }
          </button>
        </div>
      </form>

      <!-- Additional Help -->
      <div
        class="pt-6 border-t space-y-4"
        [ngClass]="{
          'border-purple-900/20': isActor(),
          'border-neutral-700/50': !isActor()
        }"
      >
        <div
          class="text-xs font-medium uppercase tracking-wide"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Other Ways to Get Help
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- FAQ/Documentation -->
          <a
            href="#"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <h3 class="text-sm font-medium">Documentation</h3>
              <p class="text-xs opacity-70">Browse help articles</p>
            </div>
          </a>

          <!-- Contact -->
          <a
            href="mailto:support&#64;castrole.com"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <h3 class="text-sm font-medium">Email Support</h3>
              <p class="text-xs opacity-70">Direct contact</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `
})
export class SupportSectionComponent {
  isActor = input.required<boolean>();
  supportSubject = input.required<string>();
  supportConcern = input.required<string>();
  isSubmittingSupport = input.required<boolean>();
  submitSupportForm = input.required<() => void>();

  onSubmitSupportForm() {
    this.submitSupportForm()();
  }

  // Local form state
  localSupportSubject = signal('');
  localSupportConcern = signal('');

  constructor() {
    // Sync input values to local state
    effect(() => {
      this.localSupportSubject.set(this.supportSubject());
      this.localSupportConcern.set(this.supportConcern());
    }, { allowSignalWrites: true });
  }
}