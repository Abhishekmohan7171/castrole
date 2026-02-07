import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriptions-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      <div (click)="selectPlan('monthly')" class="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-8 border border-gray-700/50 cursor-pointer transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
        <div class="flex items-baseline justify-between mb-8">
          <div class="flex items-baseline gap-2">
            <span class="text-5xl font-bold text-white">₹222</span>
            <span class="text-gray-400 text-sm">/month</span>
          </div>
          <button class="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center transition-all duration-300 group-hover:border-purple-500 group-hover:bg-purple-500/10">
            <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <h3 class="text-xl font-bold text-white mb-3">monthly plan</h3>
        <p class="text-gray-400 text-sm mb-8">your starter plan to showcase your talent.</p>
        <div class="space-y-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">what's included</p>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-gray-300 text-sm">high visibility in searches</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-gray-300 text-sm">upload up to 10 audition reels</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-gray-300 text-sm">ad-free experience</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-gray-300 text-sm">full analytics access</span>
            </div>
          </div>
        </div>
        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
      <div (click)="selectPlan('yearly')" class="group relative bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-2xl p-8 border border-purple-500/30 cursor-pointer transition-all duration-300 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">save ₹442 vs monthly</div>
        <div class="flex items-baseline justify-between mb-8">
          <div class="flex items-baseline gap-2">
            <span class="text-5xl font-bold text-white">₹2,222</span>
            <span class="text-purple-300 text-sm">/year</span>
          </div>
          <button class="w-10 h-10 rounded-full border-2 border-purple-500 bg-purple-500/10 flex items-center justify-center transition-all duration-300 group-hover:bg-purple-500 group-hover:scale-110">
            <svg class="w-5 h-5 text-purple-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <h3 class="text-xl font-bold text-white mb-3">yearly plan</h3>
        <p class="text-purple-200 text-sm mb-8">get all premium features with yearly savings.</p>
        <div class="space-y-4">
          <p class="text-xs font-semibold text-purple-300/70 uppercase tracking-wider">what's included</p>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-white text-sm font-medium">high visibility in searches</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-white text-sm font-medium">upload up to 10 audition reels</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-white text-sm font-medium">ad-free experience</span>
            </div>
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              <span class="text-white text-sm font-medium">full analytics access</span>
            </div>
          </div>
        </div>
        <div class="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </div>
    <div class="mt-12 pt-8 border-t border-gray-700/50 max-w-5xl">
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Subscription Management</h3>
        <div class="space-y-3">
          <button (click)="manageSubscription.emit()" class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-700/50 transition-all duration-200 hover:border-purple-500/50 hover:bg-gray-800/30">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <div class="text-left">
                <p class="text-sm font-medium text-white">manage subscription</p>
                <p class="text-xs text-gray-400">cancel or modify your plan</p>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button (click)="viewPaymentHistory.emit()" class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-700/50 transition-all duration-200 hover:border-purple-500/50 hover:bg-gray-800/30">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <div class="text-left">
                <p class="text-sm font-medium text-white">payment history</p>
                <p class="text-xs text-gray-400">view past transactions</p>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
    @if (showConfirmModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" style="animation: fadeIn 0.2s ease-out" (click)="closeModal()">
        <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl shadow-purple-500/20" style="animation: scaleIn 0.3s ease-out" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h3 class="text-2xl font-bold text-white mb-2">upgrade to {{ selectedPlan() === 'monthly' ? 'monthly' : 'yearly' }} plan</h3>
              <p class="text-gray-400 text-sm">{{ selectedPlan() === 'monthly' ? 'start your premium journey' : 'save big with yearly subscription' }}</p>
            </div>
            <button (click)="closeModal()" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700/50">
            <div class="flex items-baseline justify-between mb-4">
              <span class="text-gray-400 text-sm">total amount</span>
              <div class="flex items-baseline gap-2">
                <span class="text-4xl font-bold text-white">₹{{ selectedPlan() === 'monthly' ? '222' : '2,222' }}</span>
                <span class="text-gray-400 text-sm">/{{ selectedPlan() === 'monthly' ? 'month' : 'year' }}</span>
              </div>
            </div>
            @if (selectedPlan() === 'yearly') {
              <div class="flex items-center justify-between pt-4 border-t border-gray-700/50">
                <span class="text-green-400 text-sm font-medium">you save</span>
                <span class="text-green-400 text-lg font-bold">₹442</span>
              </div>
            }
          </div>
          <div class="flex gap-3">
            <button (click)="closeModal()" class="flex-1 px-6 py-3 rounded-xl border border-gray-600 text-white font-medium hover:bg-gray-800 transition-all duration-200">cancel</button>
            <button (click)="confirmUpgrade()" class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">proceed to payment</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class SubscriptionsSectionComponent {
  isActor = input.required<boolean>();
  upgradeToMonthly = output<void>();
  upgradeToYearly = output<void>();
  manageSubscription = output<void>();
  viewPaymentHistory = output<void>();

  showConfirmModal = signal(false);
  selectedPlan = signal<'monthly' | 'yearly'>('monthly');

  selectPlan(plan: 'monthly' | 'yearly') {
    this.selectedPlan.set(plan);
    this.showConfirmModal.set(true);
  }

  closeModal() {
    this.showConfirmModal.set(false);
  }

  confirmUpgrade() {
    if (this.selectedPlan() === 'monthly') {
      this.upgradeToMonthly.emit();
    } else {
      this.upgradeToYearly.emit();
    }
    this.closeModal();
  }
}
