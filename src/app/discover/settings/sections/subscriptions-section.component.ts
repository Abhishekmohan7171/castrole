import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriptions-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Current Plan Section -->
      <div class="space-y-6">
        <div
          class="text-xs font-medium uppercase tracking-wide"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Here's what you're currently paying:
        </div>

        <!-- Current Plan Display -->
        <div class="space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <span
              class="w-1.5 h-1.5 rounded-full"
              [ngClass]="{
                'bg-purple-400': isActor(),
                'bg-neutral-400': !isActor()
              }"
            ></span>
            <span
              [ngClass]="{
                'text-purple-200': isActor(),
                'text-neutral-200': !isActor()
              }"
            >
              Monthly Plan: ₹222 per month
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="w-1.5 h-1.5 rounded-full"
              [ngClass]="{
                'bg-purple-400': isActor(),
                'bg-neutral-400': !isActor()
              }"
            ></span>
            <span
              [ngClass]="{
                'text-purple-200': isActor(),
                'text-neutral-200': !isActor()
              }"
            >
              Over a full year, that totals ₹2,664
            </span>
          </div>
        </div>
      </div>

      <!-- Better Option Section -->
      <div class="space-y-6">
        <div
          class="text-xs font-medium uppercase tracking-wide"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Choose your plan:
        </div>

        <!-- Plan Benefits Summary -->
        <div class="space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <span
              class="w-1.5 h-1.5 rounded-full"
              [ngClass]="{
                'bg-purple-400': isActor(),
                'bg-neutral-400': !isActor()
              }"
            ></span>
            <span
              [ngClass]="{
                'text-purple-200': isActor(),
                'text-neutral-200': !isActor()
              }"
            >
              Monthly: ₹222 per month (₹2,664 per year)
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="w-1.5 h-1.5 rounded-full"
              [ngClass]="{
                'bg-purple-400': isActor(),
                'bg-neutral-400': !isActor()
              }"
            ></span>
            <span
              [ngClass]="{
                'text-purple-200': isActor(),
                'text-neutral-200': !isActor()
              }"
            >
              Yearly: ₹2,222 per year (save ₹442 vs monthly)
            </span>
          </div>
        </div>

        <!-- Plan Selection Buttons -->
        <div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Monthly Plan -->
          <button
            (click)="upgradeToMonthly()"
            class="w-full px-6 py-4 rounded-2xl text-sm font-semibold text-left transition-all duration-200 border"
            [ngClass]="{
              'bg-black/30 border-purple-900/40 hover:bg-black/40 text-purple-100':
                isActor(),
              'bg-black/30 border-neutral-700/60 hover:bg-black/40 text-neutral-100':
                !isActor()
            }"
          >
            <div class="flex items-baseline justify-between gap-2">
              <span>Monthly</span>
              <span class="text-base font-bold">₹222</span>
            </div>
            <div class="mt-1 text-xs opacity-70">
              per month · ₹2,664 over a full year
            </div>
          </button>

          <!-- Yearly Plan -->
          <button
            (click)="upgradeToYearly()"
            class="w-full px-6 py-4 rounded-2xl text-sm font-semibold text-left transition-all duration-200 border"
            [ngClass]="{
              'bg-purple-600/80 hover:bg-purple-700 text-white border-purple-400/60':
                isActor(),
              'bg-neutral-600/80 hover:bg-neutral-700 text-white border-neutral-400/60':
                !isActor()
            }"
          >
            <div class="flex items-baseline justify-between gap-2">
              <span>Yearly</span>
              <span class="text-base font-bold">₹2,222</span>
            </div>
            <div class="mt-1 text-xs text-green-400 font-medium">
              Save ₹442 compared to paying monthly
            </div>
          </button>
        </div>
      </div>

      <!-- Why Upgrade Section -->
      <div class="space-y-6">
        <div
          class="text-xs font-medium uppercase tracking-wide"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Why Upgrade?
        </div>

        <!-- Benefits List -->
        <div class="space-y-4 text-sm">
          <div class="flex items-start gap-3">
            <span
              class="w-1.5 h-1.5 rounded-full mt-2"
              [ngClass]="{
                'bg-purple-400': isActor(),
                'bg-neutral-400': !isActor()
              }"
            ></span>
            <span
              [ngClass]="{
                'text-purple-200/80': isActor(),
                'text-neutral-300': !isActor()
              }"
            >
              Get all premium benefits for the whole year upfront.
            </span>
          </div>

          <div class="flex items-start gap-3">
            <span
              class="w-1.5 h-1.5 rounded-full mt-2"
              [ngClass]="{
                'bg-purple-400': isActor(),
                'bg-neutral-400': !isActor()
              }"
            ></span>
            <span
              [ngClass]="{
                'text-purple-200/80': isActor(),
                'text-neutral-300': !isActor()
              }"
            >
              Enjoy high visibility, ad-free experience, upload up to 10
              audition reels, and full analytics without worrying about monthly
              renewals.
            </span>
          </div>

          <div class="flex items-start gap-3">
            <span
              class="w-1.5 h-1.5 rounded-full mt-2"
              [ngClass]="{
                'bg-purple-400': isActor(),
                'bg-neutral-400': !isActor()
              }"
            ></span>
            <span
              [ngClass]="{
                'text-purple-200/80': isActor(),
                'text-neutral-300': !isActor()
              }"
            >
              One-time payment = peace of mind + savings.
            </span>
          </div>
        </div>
      </div>

      <!-- Subscription Management Section -->
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
          Subscription Management
        </div>

        <!-- Management Options -->
        <div class="space-y-3">
          <!-- Manage Subscription -->
          <button
            (click)="manageSubscription()"
            class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <div class="flex items-center gap-3">
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div class="text-left">
                <h3 class="text-sm font-medium">Manage Subscription</h3>
                <p class="text-xs opacity-70">
                  Update plan, payment method, or cancel
                </p>
              </div>
            </div>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <!-- Payment History -->
          <button
            (click)="viewPaymentHistory()"
            class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <div class="flex items-center gap-3">
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
              <div class="text-left">
                <h3 class="text-sm font-medium">Payment History</h3>
                <p class="text-xs opacity-70">
                  View past invoices and receipts
                </p>
              </div>
            </div>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class SubscriptionsSectionComponent {
  isActor = input.required<boolean>();
  upgradeToMonthly = input.required<() => void>();
  upgradeToYearly = input.required<() => void>();
  manageSubscription = input.required<() => void>();
  viewPaymentHistory = input.required<() => void>();
}
