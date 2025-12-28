import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserDoc } from '../../../assets/interfaces/interfaces';

@Component({
  selector: 'app-reactivate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-950 via-black to-purple-950">
      <div class="w-full max-w-md">
        <!-- Reactivation Card -->
        <div class="bg-purple-950/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-900/30 shadow-2xl">
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-purple-100 mb-2">
              Account Scheduled for Deletion
            </h1>
            <p class="text-purple-300/70 text-sm">
              Your account deletion is pending
            </p>
          </div>

          @if (isLoading()) {
            <!-- Loading State -->
            <div class="flex flex-col items-center justify-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <p class="text-purple-300 text-sm">Loading account status...</p>
            </div>
          } @else if (error()) {
            <!-- Error State -->
            <div class="bg-red-600/10 border border-red-600/30 rounded-lg p-4 mb-6">
              <p class="text-red-400 text-sm">{{ error() }}</p>
            </div>
            <button
              (click)="logout()"
              class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200"
            >
              Return to Login
            </button>
          } @else {
            <!-- Deletion Info -->
            <div class="space-y-6 mb-8">
              <div class="bg-purple-900/20 rounded-lg p-4 border border-purple-800/30">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p class="text-purple-200 text-sm font-medium mb-1">Deletion Date</p>
                    <p class="text-purple-100 text-lg font-bold">
                      {{ deletionDate() | date:'MMMM d, y' }}
                    </p>
                    <p class="text-purple-400 text-xs mt-1">
                      {{ deletionDate() | date:'h:mm a' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-orange-600/10 rounded-lg p-4 border border-orange-600/30">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p class="text-orange-200 text-sm font-medium mb-1">Time Remaining</p>
                    <p class="text-orange-100 text-2xl font-bold">
                      {{ daysRemaining() }} {{ daysRemaining() === 1 ? 'day' : 'days' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-blue-600/10 rounded-lg p-4 border border-blue-600/30">
                <p class="text-blue-300 text-sm leading-relaxed">
                  After this date, all your data will be <strong class="text-blue-200">permanently deleted</strong> including your profile, media, chat history, and analytics.
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <button
                (click)="reactivateAccount()"
                [disabled]="isReactivating()"
                class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isReactivating()) {
                  <div class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                      <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Reactivating...
                  </div>
                } @else {
                  Reactivate My Account
                }
              </button>

              <button
                (click)="proceedWithDeletion()"
                [disabled]="isReactivating()"
                class="w-full px-4 py-3 border border-purple-800/50 text-purple-300 hover:bg-purple-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed with Deletion
              </button>
            </div>
          }
        </div>

        <!-- Help Text -->
        <p class="text-center text-purple-400/60 text-xs mt-6">
          Need help? Contact us at support&#64;castrole.com
        </p>
      </div>
    </div>
  `,
  styles: [],
})
export class ReactivateComponent implements OnInit {
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  isReactivating = signal(false);
  error = signal<string | null>(null);
  deletionDate = signal<Date | null>(null);
  daysRemaining = computed(() => {
    const deletion = this.deletionDate();
    if (!deletion) return 0;
    const diff = deletion.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  });

  async ngOnInit() {
    await this.loadAccountStatus();
  }

  private async loadAccountStatus() {
    const user = this.auth.currentUser;

    if (!user) {
      this.error.set('You must be logged in to reactivate your account.');
      this.isLoading.set(false);
      return;
    }

    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        this.error.set('Account not found.');
        this.isLoading.set(false);
        return;
      }

      const userData = userDoc.data() as UserDoc;

      if (!userData.deleteAccount) {
        // Account is not scheduled for deletion, redirect to discover
        this.router.navigate(['/discover']);
        return;
      }

      const deletionDateValue = userData.deleteAccountDate?.toDate?.();
      if (!deletionDateValue) {
        this.error.set('Invalid deletion date.');
        this.isLoading.set(false);
        return;
      }

      // Check if grace period has expired
      if (deletionDateValue < new Date()) {
        this.error.set('The grace period for reactivation has expired. Your account has been or will be deleted.');
        this.isLoading.set(false);
        return;
      }

      this.deletionDate.set(deletionDateValue);
      this.isLoading.set(false);
    } catch (err) {
      console.error('Error loading account status:', err);
      this.error.set('Failed to load account status. Please try again.');
      this.isLoading.set(false);
    }
  }

  async reactivateAccount() {
    const user = this.auth.currentUser;
    if (!user) return;

    this.isReactivating.set(true);

    try {
      await this.authService.reactivateAccount(user.uid);

      this.toastService.success('Account reactivated successfully!');

      // Redirect to discover page
      this.router.navigate(['/discover']);
    } catch (error) {
      console.error('Error reactivating account:', error);
      this.toastService.error('Failed to reactivate account. Please try again.');
      this.isReactivating.set(false);
    }
  }

  async proceedWithDeletion() {
    if (!confirm('Are you sure you want to proceed with account deletion? This cannot be undone after the grace period.')) {
      return;
    }

    await this.logout();
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error logging out:', error);
      this.router.navigate(['/auth/login']);
    }
  }
}
