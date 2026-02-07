import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Auth } from '@angular/fire/auth';
import { ToastService } from './toast.service';
import { LoadingService } from './loading.service';
import {
  RazorpayOptions,
  RazorpayResponse,
  PaymentTransaction,
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  GetPaymentHistoryResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
} from '../interfaces/payment.interfaces';
import { getRazorpayKeyId, razorpayConfig } from '../config/razorpay.config';

// Direct Cloud Functions URL - not used when using httpsCallable
// const FUNCTIONS_BASE_URL = 'https://us-central1-yberhood-castrole.cloudfunctions.net';

/**
 * PaymentService
 * 
 * Handles all payment-related operations:
 * - Loading Razorpay SDK dynamically
 * - Creating payment orders via Cloud Functions
 * - Opening Razorpay checkout modal
 * - Verifying payments via Cloud Functions
 * - Fetching payment history
 * - Cancelling subscriptions
 * 
 * SECURITY:
 * - All sensitive operations go through Cloud Functions
 * - Only public key_id is used client-side
 * - Payment verification happens server-side
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private functions = inject(Functions);
  private auth = inject(Auth);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  // State signals
  private razorpayLoaded = signal(false);
  isProcessingPayment = signal(false);

  /**
   * Load Razorpay SDK dynamically
   * Only loads once, subsequent calls return immediately
   */
  async loadRazorpaySDK(): Promise<void> {
    if (this.razorpayLoaded()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.razorpayLoaded.set(true);
        console.log('✓ Razorpay SDK loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        reject(new Error('Failed to load Razorpay SDK'));
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Initiate payment flow
   * 
   * Steps:
   * 1. Load Razorpay SDK
   * 2. Create order via Cloud Function (server-side pricing)
   * 3. Open Razorpay checkout modal
   * 4. Handle payment response
   * 5. Verify payment via Cloud Function
   * 
   * @param plan - 'monthly' or 'yearly'
   * @param userData - User information for prefill
   */
  async initiatePayment(
    plan: 'monthly' | 'yearly',
    userData: { name: string; email: string; phone: string }
  ): Promise<void> {
    try {
      this.isProcessingPayment.set(true);
      this.loadingService.setLoading(true);

      console.log('🔍 PaymentService.initiatePayment called');
      console.log('🔍 Plan:', plan);
      console.log('🔍 UserData:', userData);

      // Step 1: Load Razorpay SDK
      console.log('📦 Loading Razorpay SDK...');
      await this.loadRazorpaySDK();
      console.log('✓ Razorpay SDK loaded');

      // Step 2: Create order via Cloud Function
      console.log(' Calling createRazorpayOrder function with plan:', plan);
      const createOrderFn = httpsCallable<CreateOrderRequest, CreateOrderResponse>(
        this.functions,
        'createRazorpayOrder'
      );
      
      const result = await createOrderFn({ plan });
      console.log('✓ Order result received:', result);
      
      const orderData = result.data;
      console.log('✓ Order created:', orderData.orderId);

      // Step 3 & 4: Open Razorpay checkout and handle response
      console.log('💳 Opening Razorpay checkout...');
      await this.openCheckout(orderData, userData, plan);

      console.log('✓ Payment flow completed successfully');

    } catch (error: any) {
      console.error('❌ Payment initiation error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        name: error.name,
        stack: error.stack
      });
      
      // Don't show error if user cancelled
      if (error.message !== 'Payment cancelled by user') {
        const errorMsg = error.message || error.details?.message || 'Failed to initiate payment. Please try again.';
        this.toastService.error(errorMsg);
      }
      
      throw error;
    } finally {
      this.isProcessingPayment.set(false);
      this.loadingService.setLoading(false);
    }
  }

  /**
   * Open Razorpay checkout modal
   * 
   * @private
   */
  private async openCheckout(
    orderData: CreateOrderResponse,
    userData: { name: string; email: string; phone: string },
    plan: 'monthly' | 'yearly'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: RazorpayOptions = {
        key: getRazorpayKeyId(),
        amount: orderData.amount,
        currency: orderData.currency,
        name: razorpayConfig.checkout.name,
        description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            console.log('✓ Payment successful, verifying...');
            await this.verifyPayment(response);
            this.toastService.success('Payment successful! Your subscription is now active.');
            resolve();
          } catch (error: any) {
            console.error('Payment verification failed:', error);
            this.toastService.error('Payment verification failed. Please contact support.');
            reject(error);
          }
        },
        prefill: {
          name: userData.name,
          email: userData.email,
          contact: userData.phone,
        },
        theme: {
          color: razorpayConfig.checkout.theme.color,
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed by user');
            this.toastService.info('Payment cancelled');
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      // Check if Razorpay is available
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  /**
   * Verify payment via Cloud Function
   * 
   * SECURITY: This is preliminary verification
   * - Webhook will provide final confirmation
   * - This allows immediate UI feedback
   * 
   * @private
   */
  private async verifyPayment(response: RazorpayResponse): Promise<void> {
    const verifyFn = httpsCallable<VerifyPaymentRequest, VerifyPaymentResponse>(
      this.functions,
      'verifyRazorpayPayment'
    );

    const result = await verifyFn({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    });

    console.log('✓ Payment verified:', result.data.message);
  }

  /**
   * Get payment history for current user
   * 
   * @returns Array of payment transactions
   */
  async getPaymentHistory(): Promise<PaymentTransaction[]> {
    try {
      this.loadingService.setLoading(true);

      const getHistoryFn = httpsCallable<void, GetPaymentHistoryResponse>(
        this.functions,
        'getPaymentHistory'
      );

      const result = await getHistoryFn();
      console.log(`✓ Retrieved ${result.data.transactions.length} transactions`);
      
      return result.data.transactions;
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      this.toastService.error('Failed to load payment history');
      return [];
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  /**
   * Cancel active subscription
   * 
   * @param reason - Optional cancellation reason
   * @returns true if successful, false otherwise
   */
  async cancelSubscription(reason?: string): Promise<boolean> {
    try {
      this.loadingService.setLoading(true);

      const cancelFn = httpsCallable<CancelSubscriptionRequest, CancelSubscriptionResponse>(
        this.functions,
        'cancelSubscription'
      );

      const result = await cancelFn({ reason });
      this.toastService.success(result.data.message);
      console.log('✓ Subscription cancelled');
      
      return true;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      this.toastService.error(error.message || 'Failed to cancel subscription');
      return false;
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  /**
   * Get display amount for a plan
   * 
   * @param plan - 'monthly' or 'yearly'
   * @returns Formatted amount string (e.g., '₹222')
   */
  getPlanDisplayAmount(plan: 'monthly' | 'yearly'): string {
    return razorpayConfig.plans[plan].displayAmount;
  }

  /**
   * Get plan duration
   * 
   * @param plan - 'monthly' or 'yearly'
   * @returns Duration string (e.g., '1 month')
   */
  getPlanDuration(plan: 'monthly' | 'yearly'): string {
    return razorpayConfig.plans[plan].duration;
  }

  /**
   * Check if Razorpay SDK is loaded
   */
  isRazorpayLoaded(): boolean {
    return this.razorpayLoaded();
  }

  /**
   * Check if payment is currently being processed
   */
  isPaymentProcessing(): boolean {
    return this.isProcessingPayment();
  }
}
