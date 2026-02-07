import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentTransaction } from '../../../interfaces/payment.interfaces';

/**
 * PaymentHistoryModalComponent
 * 
 * Displays user's payment transaction history in a modal
 * Features:
 * - Transaction list with dates
 * - Payment status indicators
 * - Plan type and amounts
 * - Empty state for no transactions
 * - Responsive design
 */
@Component({
  selector: 'app-payment-history-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      (click)="close.emit()"
    >
      <div 
        class="w-full max-w-2xl rounded-2xl p-6 bg-purple-950/90 ring-1 ring-purple-900/30 shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-purple-100">Payment History</h3>
          <button 
            (click)="close.emit()" 
            class="p-2 rounded-lg hover:bg-purple-900/20 text-purple-300 transition-colors"
            aria-label="Close modal"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fill-rule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <!-- Transaction List -->
        <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          @if (transactions().length === 0) {
            <!-- Empty State -->
            <div class="text-center py-12">
              <svg 
                class="w-16 h-16 mx-auto mb-4 text-purple-300/30" 
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
              <p class="text-purple-200/70 text-sm">No payment history yet</p>
              <p class="text-purple-200/50 text-xs mt-1">Your transactions will appear here</p>
            </div>
          } @else {
            @for (txn of transactions(); track txn.id) {
              <div class="p-4 rounded-lg border border-purple-900/30 bg-purple-950/20 hover:bg-purple-900/10 transition-colors">
                <div class="flex justify-between items-start">
                  <!-- Transaction Details -->
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <p class="text-sm font-medium text-purple-100">
                        {{ getPlanName(txn.plan) }} Plan
                      </p>
                      <span [ngClass]="getStatusClass(txn.status)" class="text-xs px-2 py-0.5 rounded-full font-medium">
                        {{ getStatusText(txn.status) }}
                      </span>
                    </div>
                    <p class="text-xs text-purple-200/70">
                      {{ formatDate(txn.timestamp) }}
                    </p>
                    <p class="text-xs text-purple-200/50 mt-1">
                      Order ID: {{ txn.orderId }}
                    </p>
                  </div>
                  
                  <!-- Amount -->
                  <div class="text-right">
                    <p class="text-lg font-bold text-purple-100">
                      ₹{{ txn.amountRupees }}
                    </p>
                    <p class="text-xs text-purple-200/50">
                      {{ txn.amountPaise }} paise
                    </p>
                  </div>
                </div>

                <!-- Payment ID (if available) -->
                @if (txn.paymentId) {
                  <div class="mt-2 pt-2 border-t border-purple-900/20">
                    <p class="text-xs text-purple-200/50">
                      Payment ID: {{ txn.paymentId }}
                    </p>
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-purple-900/30">
          <p class="text-xs text-purple-200/50 text-center">
            For support or refund requests, please contact us at support&#64;castrole.com
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(147, 51, 234, 0.1);
      border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(147, 51, 234, 0.3);
      border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(147, 51, 234, 0.5);
    }
  `]
})
export class PaymentHistoryModalComponent {
  transactions = input.required<PaymentTransaction[]>();
  close = output<void>();

  /**
   * Format timestamp to readable date
   */
  formatDate(timestamp: any): string {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  }

  /**
   * Get plan display name
   */
  getPlanName(plan: 'monthly' | 'yearly'): string {
    return plan === 'monthly' ? 'Monthly' : 'Yearly';
  }

  /**
   * Get status display text
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'success': 'Success',
      'failed': 'Failed',
      'pending': 'Pending'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status badge CSS classes
   */
  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'success': 'bg-green-500/20 text-green-300',
      'failed': 'bg-red-500/20 text-red-300',
      'pending': 'bg-yellow-500/20 text-yellow-300'
    };
    return classMap[status] || 'bg-gray-500/20 text-gray-300';
  }
}
