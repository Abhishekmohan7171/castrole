import { Timestamp } from 'firebase/firestore';

// ==================== RAZORPAY SDK TYPES ====================

/**
 * Razorpay Checkout Options
 * Used when opening the Razorpay payment modal
 */
export interface RazorpayOptions {
  key: string; // Razorpay key_id (public key)
  amount: number; // Amount in paise (e.g., 22200 for ₹222)
  currency: string; // Currency code (e.g., 'INR')
  name: string; // Business/app name
  description: string; // Payment description
  order_id: string; // Order ID from Razorpay
  handler: (response: RazorpayResponse) => void; // Success callback
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string; // Brand color in hex
  };
  modal?: {
    ondismiss?: () => void; // Called when user closes modal
  };
}

/**
 * Razorpay Payment Response
 * Returned after successful payment
 */
export interface RazorpayResponse {
  razorpay_payment_id: string; // Unique payment ID
  razorpay_order_id: string; // Order ID that was paid
  razorpay_signature: string; // HMAC signature for verification
}

/**
 * Razorpay Window Interface
 * Extends Window to include Razorpay SDK
 */
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ==================== PAYMENT ORDER ====================

/**
 * Payment Order
 * Created before initiating payment
 */
export interface PaymentOrder {
  orderId: string; // Razorpay order ID
  amount: number; // Amount in paise
  currency: string; // Currency code
  receipt: string; // Unique receipt ID
  status: 'created' | 'attempted' | 'paid';
}

// ==================== PAYMENT RECORD ====================

/**
 * Payment Record
 * Stored in Firestore: payments/{paymentId}
 */
export interface Payment {
  id?: string; // Firestore document ID
  userId: string; // User who made the payment
  orderId: string; // Razorpay order ID
  razorpayOrderId: string; // Razorpay order ID (same as orderId)
  razorpayPaymentId?: string; // Razorpay payment ID (after payment)
  razorpaySignature?: string; // HMAC signature (after payment)
  amountPaise: number; // Amount in paise (e.g., 22200 for ₹222)
  amountRupees: number; // Amount in rupees (e.g., 222)
  currency: 'INR'; // Currency
  plan: 'monthly' | 'yearly'; // Subscription plan
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  failureReason?: string; // Reason if payment failed
  verifiedByClient?: boolean; // Preliminary client verification (not final)
  verifiedByWebhook?: boolean; // Final webhook verification (source of truth)
}

// ==================== SUBSCRIPTION METADATA ====================

/**
 * Subscription Metadata
 * Stored in profiles/{uid}/actorProfile.subscriptionMetadata
 * OR profiles/{uid}/producerProfile.subscriptionMetadata
 */
export interface SubscriptionMetadata {
  plan: 'monthly' | 'yearly'; // Subscription plan type
  amountPaise: number; // Amount paid in paise (e.g., 22200)
  amountRupees: number; // Amount paid in rupees (e.g., 222)
  startDate: Timestamp | any; // Subscription start date
  endDate: Timestamp | any; // Subscription end date
  paymentId: string; // Reference to payment ID
  autoRenew: boolean; // Auto-renewal enabled
  status: 'active' | 'cancelled' | 'expired'; // Current status
  cancelledAt?: Timestamp | any; // When subscription was cancelled
  cancellationReason?: string; // Why it was cancelled
}

// ==================== PAYMENT TRANSACTION ====================

/**
 * Payment Transaction
 * Stored in payment_history/{userId}/transactions/{txnId}
 */
export interface PaymentTransaction {
  id?: string; // Firestore document ID
  orderId: string; // Razorpay order ID
  paymentId: string; // Razorpay payment ID
  amountPaise: number; // Amount in paise (e.g., 22200)
  amountRupees: number; // Amount in rupees (e.g., 222)
  plan: 'monthly' | 'yearly'; // Plan type
  status: 'success' | 'failed' | 'pending'; // Transaction status
  timestamp: Timestamp | any; // When transaction occurred
  invoiceUrl?: string; // URL to invoice (if available)
}

// ==================== CLOUD FUNCTION REQUEST/RESPONSE TYPES ====================

/**
 * Create Order Request
 * Sent to createRazorpayOrder Cloud Function
 */
export interface CreateOrderRequest {
  plan: 'monthly' | 'yearly';
}

/**
 * Create Order Response
 * Returned from createRazorpayOrder Cloud Function
 */
export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Verify Payment Request
 * Sent to verifyRazorpayPayment Cloud Function
 */
export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Verify Payment Response
 * Returned from verifyRazorpayPayment Cloud Function
 */
export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
}

/**
 * Get Payment History Response
 * Returned from getPaymentHistory Cloud Function
 */
export interface GetPaymentHistoryResponse {
  transactions: PaymentTransaction[];
}

/**
 * Cancel Subscription Request
 * Sent to cancelSubscription Cloud Function
 */
export interface CancelSubscriptionRequest {
  reason?: string;
}

/**
 * Cancel Subscription Response
 * Returned from cancelSubscription Cloud Function
 */
export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
}

// ==================== WEBHOOK TYPES ====================

/**
 * Razorpay Webhook Event
 * Received from Razorpay webhook
 */
export interface RazorpayWebhookEvent {
  event: 'payment.captured' | 'payment.failed' | 'payment.authorized' | 'refund.processed';
  payload: {
    payment: {
      entity: {
        id: string; // Payment ID
        order_id: string; // Order ID
        amount: number; // Amount in paise
        currency: string;
        status: string;
        error_description?: string; // If failed
      };
    };
  };
}
