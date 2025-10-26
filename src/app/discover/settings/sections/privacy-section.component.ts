import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-privacy-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold text-white mb-6">Privacy & Security</h2>
      <div class="space-y-6">
        <!-- Profile Visibility -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-neutral-400 uppercase tracking-wide">profile visibility</h3>
          
          <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
            <div>
              <p class="text-white font-medium">ghost mode</p>
              <p class="text-xs text-neutral-500 mt-1">hide your profile from search</p>
            </div>
            <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
            </button>
          </div>
        </div>

        <!-- Account Management -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-neutral-400 uppercase tracking-wide">account management</h3>
          
          <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span class="text-white">client forms</span>
            </div>
            <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span class="text-white">blocked users</span>
            </div>
            <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button class="w-full flex items-center justify-between py-4 px-6 bg-red-900/20 rounded-xl border border-red-800/50 hover:bg-red-900/30 transition-all">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="text-red-400">delete account</span>
            </div>
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Chat Settings -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-neutral-400 uppercase tracking-wide">chat</h3>
          
          <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
            <div>
              <p class="text-white font-medium">last seen</p>
            </div>
            <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
            </button>
          </div>

          <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
            <div>
              <p class="text-white font-medium">online tag</p>
            </div>
            <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
            </button>
          </div>

          <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
            <div>
              <p class="text-white font-medium">read receipts</p>
            </div>
            <button 
              (click)="toggleReadReceipts()"
              [class]="readReceipts() 
                ? 'relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors hover:bg-purple-700'
                : 'relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600'"
            >
              <span 
                [class]="readReceipts() 
                  ? 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6'
                  : 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1'"
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PrivacySectionComponent {
  private auth = inject(AuthService);
  private firestore = inject(Firestore);

  readReceipts = signal<boolean>(true);

  async toggleReadReceipts() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const newValue = !this.readReceipts();
      this.readReceipts.set(newValue);

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        readReceipts: newValue,
      });
    } catch (error) {
      // Revert on error
      this.readReceipts.set(!this.readReceipts());
    }
  }
}
