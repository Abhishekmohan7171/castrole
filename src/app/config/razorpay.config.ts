/**
 * Razorpay Configuration
 * 
 * IMPORTANT: 
 * - Only key_id (public key) is stored here
 * - key_secret (private key) is NEVER exposed to client
 * - key_secret is stored securely in Firebase Functions config
 * 
 * To switch between test and production:
 * 1. Update key_id below
 * 2. Update Firebase Functions config using Firebase CLI:
 *    firebase functions:config:set razorpay.key_id="YOUR_KEY" razorpay.key_secret="YOUR_SECRET"
 */

export const razorpayConfig = {
  // Test mode key (starts with rzp_test_)
  // Replace with production key (rzp_live_) when going live
  keyId: 'rzp_test_SBNYVdZyiDhyRU', // TODO: Replace with your actual Razorpay test key_id
  
  // Razorpay checkout configuration
  checkout: {
    name: 'Castrole',
    description: 'Subscription Payment',
    currency: 'INR',
    theme: {
      color: '#9333EA', // Purple theme for actors
    },
  },
  
  // Plan pricing (in paise - 1 INR = 100 paise)
  // These are reference values only - actual pricing is enforced server-side
  plans: {
    monthly: {
      amount: 22200, // ₹222
      displayAmount: '₹222',
      duration: '1 month',
    },
    yearly: {
      amount: 222200, // ₹2222
      displayAmount: '₹2,222',
      duration: '1 year',
    },
  },
};

/**
 * Get Razorpay key_id for current environment
 */
export function getRazorpayKeyId(): string {
  return razorpayConfig.keyId;
}

/**
 * Get plan amount (for display only - server validates actual amount)
 */
export function getPlanAmount(plan: 'monthly' | 'yearly'): number {
  return razorpayConfig.plans[plan].amount;
}

/**
 * Get plan display amount
 */
export function getPlanDisplayAmount(plan: 'monthly' | 'yearly'): string {
  return razorpayConfig.plans[plan].displayAmount;
}
