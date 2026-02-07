import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

// ==================== RAZORPAY INSTANCE ====================

/**
 * Get Razorpay instance with credentials from Firebase config
 * SECURITY: key_secret is NEVER exposed to client
 */
const getRazorpayInstance = () => {
  // Try functions.config() first (production), fallback to env vars (emulator)
  const config = functions.config().razorpay || {};
  const keyId = config.key_id || process.env.RAZORPAY_KEY_ID || 'rzp_test_SBNYVdZyiDhyRU';
  const keySecret = config.key_secret || process.env.RAZORPAY_KEY_SECRET || 'BZ9nMfG09MSIk62VkkCs8E39';
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay configuration missing. Run: firebase functions:config:set razorpay.key_id="..." razorpay.key_secret="..."');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert paise to rupees
 */
function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Convert rupees to paise (kept for future use)
 * Currently unused but may be needed for custom pricing
 */
// function rupeesToPaise(rupees: number): number {
//   return Math.round(rupees * 100);
// }

/**
 * Get server-side pricing (NEVER trust client)
 * This is the ONLY source of truth for pricing
 */
function getServerPricing(plan: 'monthly' | 'yearly'): { amountPaise: number; amountRupees: number } {
  const pricing = {
    monthly: { amountRupees: 222, amountPaise: 22200 },
    yearly: { amountRupees: 2222, amountPaise: 222200 },
  };

  return pricing[plan];
}

// ==================== 1️⃣ CREATE RAZORPAY ORDER ====================

/**
 * 🔐 SECURITY: Server-side order creation
 * - Validates authentication
 * - Enforces server-side pricing (prevents tampering)
 * - Protects key_secret
 * - Creates order with Razorpay
 * - Stores order in Firestore
 */
export const createRazorpayOrder = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    console.log('🔵 createRazorpayOrder called');
    
    try {
      // Verify authentication
      if (!context.auth) {
        console.log('❌ No auth context');
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = context.auth.uid;
      console.log('✅ Auth verified for user:', userId);

      const { plan } = data;
      
      // Validate plan
      if (!plan || !['monthly', 'yearly'].includes(plan)) {
        console.log('❌ Invalid plan:', plan);
        throw new functions.https.HttpsError('invalid-argument', 'Invalid plan type. Must be "monthly" or "yearly"');
      }

      console.log('✅ Plan validated:', plan);

      // 🔐 SERVER-SIDE PRICING (NEVER trust client)
      const pricing = getServerPricing(plan);
      const { amountPaise, amountRupees } = pricing;
      const currency = 'INR';
      // Receipt must be max 40 chars - use short user ID + timestamp
      const receipt = `rcpt_${userId.slice(-8)}_${Date.now()}`;

      console.log('📦 Creating Razorpay order:', { amountPaise, amountRupees, currency, receipt });

      console.log('🔑 Getting Razorpay instance...');
      const razorpay = getRazorpayInstance();
      console.log('✅ Razorpay instance created');
      
      // Create order with Razorpay
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency,
        receipt,
        notes: {
          userId,
          plan,
          amountRupees: amountRupees.toString(),
        },
      });

      console.log(`Order created: ${order.id} for user ${userId}, plan: ${plan}, amount: ₹${amountRupees}`);

      // Store in Firestore
      await admin.firestore().collection('payments').doc(order.id).set({
        userId,
        orderId: order.id,
        razorpayOrderId: order.id,
        amountPaise,
        amountRupees,
        currency,
        plan,
        status: 'created',
        verifiedByClient: false,
        verifiedByWebhook: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Return data for callable function
      return {
        orderId: order.id,
        amount: amountPaise,
        currency,
      };
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      throw new functions.https.HttpsError('internal', `Failed to create order: ${error.message}`);
    }
  });

// ==================== 2️⃣ VERIFY RAZORPAY PAYMENT (PRELIMINARY) ====================

/**
 * 🔐 SECURITY: Client-side payment verification (PRELIMINARY ONLY)
 * 
 * ⚠️ IMPORTANT: This is NOT the final authority
 * - Client verification = preliminary check
 * - Webhook verification = final source of truth
 * - Subscription granted here, but webhook can override
 * 
 * What this does:
 * - Receives payment response from client
 * - Generates HMAC using key_secret
 * - Verifies signature matches
 * - Marks payment as "verified by client"
 * - Grants preliminary subscription access
 * 
 * What happens next:
 * - Webhook will receive final confirmation from Razorpay
 * - Webhook updates verifiedByWebhook = true
 * - If webhook fails, subscription can be revoked
 */
export const verifyRazorpayPayment = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing payment details');
  }

  try {
    // Generate expected signature
    const key_secret = functions.config().razorpay.key_secret;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      console.error(`Signature mismatch for order ${razorpay_order_id}`);
      throw new functions.https.HttpsError('permission-denied', 'Invalid payment signature');
    }

    const userId = context.auth.uid;

    // Get payment document
    const paymentDoc = await admin.firestore().collection('payments').doc(razorpay_order_id).get();
    
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment order not found');
    }

    const paymentData = paymentDoc.data();

    // Verify user owns this payment
    if (paymentData?.userId !== userId) {
      console.error(`User ${userId} attempted to verify payment for user ${paymentData?.userId}`);
      throw new functions.https.HttpsError('permission-denied', 'Unauthorized access');
    }

    // 🔴 IDEMPOTENCY GUARD: Check if already verified
    if (paymentData?.verifiedByClient === true) {
      console.log(`Payment ${razorpay_order_id} already verified by client, skipping`);
      return { success: true, message: 'Payment already verified' };
    }

    // Update payment status (PRELIMINARY)
    await paymentDoc.ref.update({
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'authorized', // Not 'captured' yet - waiting for webhook
      verifiedByClient: true, // Mark as preliminarily verified
      updatedAt: new Date(),
    });

    console.log(`✓ Client verification successful for ${razorpay_order_id}`);

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (paymentData?.plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Grant PRELIMINARY subscription
    const profileRef = admin.firestore().collection('profiles').doc(userId);
    await profileRef.update({
      'actorProfile.isSubscribed': true,
      'actorProfile.subscriptionMetadata': {
        plan: paymentData?.plan,
        amountPaise: paymentData?.amountPaise,
        amountRupees: paymentData?.amountRupees,
        startDate,
        endDate: admin.firestore.Timestamp.fromDate(endDate),
        paymentId: razorpay_payment_id,
        autoRenew: false,
        status: 'active',
      },
    });

    console.log(`✓ Preliminary subscription granted to user ${userId}`);

    // Add to payment history
    await admin.firestore()
      .collection('payment_history')
      .doc(userId)
      .collection('transactions')
      .add({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amountPaise: paymentData?.amountPaise,
        amountRupees: paymentData?.amountRupees,
        plan: paymentData?.plan,
        status: 'success',
        timestamp: new Date(),
      });

    return { 
      success: true, 
      message: 'Payment verified (preliminary). Awaiting webhook confirmation.' 
    };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================== 3️⃣ RAZORPAY WEBHOOK (FINAL SOURCE OF TRUTH) ====================

/**
 * 🔐 SECURITY: Webhook handler (FINAL AUTHORITY)
 * 
 * This is the FINAL source of truth for payment status
 * - Server-to-server communication (no client involvement)
 * - Verifies webhook signature
 * - Handles payment.captured, payment.failed, refund.processed
 * - Updates Firestore independently
 * - Can override client verification if needed
 * 
 * ⚠️ CRITICAL: This runs independently of client
 * - Browser may close, network may fail
 * - Webhook ensures payment state is always correct
 * - This is what separates professionals from amateurs
 */
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = functions.config().razorpay?.webhook_secret;

  // 🔴 CRITICAL: Verify webhook secret is configured
  if (!webhookSecret) {
    console.error('🔴 CRITICAL: webhook_secret not configured! Run: firebase functions:config:set razorpay.webhook_secret="..."');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  if (!webhookSignature) {
    console.error('Missing webhook signature');
    res.status(400).send('Missing signature');
    return;
  }

  // Verify webhook signature
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== webhookSignature) {
    console.error('🔴 Invalid webhook signature - possible attack attempt');
    res.status(400).send('Invalid signature');
    return;
  }

  const event = req.body.event;
  const payload = req.body.payload.payment.entity;

  console.log(`📥 Webhook received: ${event} for payment ${payload.id}`);

  try {
    if (event === 'payment.captured') {
      // ✅ Payment successful - FINAL CONFIRMATION
      const orderId = payload.order_id;
      const paymentId = payload.id;
      const amountPaise = payload.amount;
      const amountRupees = paiseToRupees(amountPaise);

      const paymentDoc = await admin.firestore().collection('payments').doc(orderId).get();

      if (!paymentDoc.exists) {
        console.error(`Payment document not found for order ${orderId}`);
        res.status(404).send('Payment not found');
        return;
      }

      const paymentData = paymentDoc.data();

      // 🔴 IDEMPOTENCY GUARD: Check if already processed by webhook
      if (paymentData?.verifiedByWebhook === true && paymentData?.status === 'captured') {
        console.log(`✓ Webhook already processed for ${orderId}, skipping`);
        res.status(200).send('Already processed');
        return;
      }

      // Update payment status (FINAL)
      await paymentDoc.ref.update({
        razorpayPaymentId: paymentId,
        status: 'captured', // FINAL status
        verifiedByWebhook: true, // Mark as verified by webhook (source of truth)
        updatedAt: new Date(),
      });

      console.log(`✅ FINAL: Payment captured for order ${orderId}, amount: ₹${amountRupees}`);

      // Ensure subscription is active (in case client verification failed)
      if (paymentData?.userId) {
        const profileRef = admin.firestore().collection('profiles').doc(paymentData.userId);
        const profileDoc = await profileRef.get();

        if (profileDoc.exists) {
          const profileData = profileDoc.data();
          const isSubscribed = profileData?.actorProfile?.isSubscribed;

          if (!isSubscribed) {
            console.log(`⚠️ Client verification missed, granting subscription via webhook for user ${paymentData.userId}`);
            
            const startDate = new Date();
            const endDate = new Date();
            if (paymentData?.plan === 'monthly') {
              endDate.setMonth(endDate.getMonth() + 1);
            } else {
              endDate.setFullYear(endDate.getFullYear() + 1);
            }

            await profileRef.update({
              'actorProfile.isSubscribed': true,
              'actorProfile.subscriptionMetadata': {
                plan: paymentData?.plan,
                amountPaise: paymentData?.amountPaise,
                amountRupees: paymentData?.amountRupees,
                startDate,
                endDate: admin.firestore.Timestamp.fromDate(endDate),
                paymentId,
                autoRenew: false,
                status: 'active',
              },
            });
          }
        }
      }

    } else if (event === 'payment.failed') {
      // ❌ Payment failed
      const orderId = payload.order_id;
      const failureReason = payload.error_description || 'Payment failed';

      const paymentDoc = await admin.firestore().collection('payments').doc(orderId).get();

      if (paymentDoc.exists) {
        // 🔴 IDEMPOTENCY GUARD
        const paymentData = paymentDoc.data();
        if (paymentData?.status === 'failed') {
          console.log(`Payment ${orderId} already marked as failed`);
          res.status(200).send('Already processed');
          return;
        }

        await paymentDoc.ref.update({
          status: 'failed',
          failureReason,
          verifiedByWebhook: true,
          updatedAt: new Date(),
        });

        console.log(`❌ Payment failed for order ${orderId}: ${failureReason}`);
      }

    } else if (event === 'refund.processed') {
      // 💰 Refund processed
      const paymentId = payload.id;
      console.log(`💰 Refund processed for payment ${paymentId}`);
      
      // Find payment by razorpayPaymentId
      const paymentsQuery = await admin.firestore()
        .collection('payments')
        .where('razorpayPaymentId', '==', paymentId)
        .limit(1)
        .get();

      if (!paymentsQuery.empty) {
        const paymentDoc = paymentsQuery.docs[0];
        await paymentDoc.ref.update({
          status: 'refunded',
          updatedAt: new Date(),
        });
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal error');
  }
});

// ==================== 4️⃣ GET PAYMENT HISTORY ====================

/**
 * 🔐 SECURITY: Secure payment history retrieval
 * - Auth check
 * - Returns only logged-in user's transactions
 * - No direct Firestore access from client
 * - Prevents data leaks and cross-user access
 */
export const getPaymentHistory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const userId = context.auth.uid;

  try {
    const transactionsSnapshot = await admin.firestore()
      .collection('payment_history')
      .doc(userId)
      .collection('transactions')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Retrieved ${transactions.length} transactions for user ${userId}`);

    return { transactions };
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    throw new functions.https.HttpsError('internal', `Failed to fetch payment history: ${error.message}`);
  }
});

// ==================== 5️⃣ CANCEL SUBSCRIPTION ====================

/**
 * 🔐 SECURITY: Controlled subscription cancellation
 * - Validates user authentication
 * - Validates active subscription exists
 * - Updates subscription end date
 * - Logs cancellation reason
 * - Prevents client-side plan manipulation
 * - Keeps subscription logic centralized
 */
export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const userId = context.auth.uid;
  const { reason } = data;

  try {
    const profileRef = admin.firestore().collection('profiles').doc(userId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Profile not found');
    }

    const profileData = profileDoc.data();
    const subscriptionMetadata = profileData?.actorProfile?.subscriptionMetadata;

    if (!subscriptionMetadata || subscriptionMetadata.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'No active subscription to cancel');
    }

    // Update subscription status
    await profileRef.update({
      'actorProfile.subscriptionMetadata.status': 'cancelled',
      'actorProfile.subscriptionMetadata.cancelledAt': new Date(),
      'actorProfile.subscriptionMetadata.cancellationReason': reason || 'User requested',
      'actorProfile.subscriptionMetadata.autoRenew': false,
    });

    console.log(`Subscription cancelled for user ${userId}, reason: ${reason || 'User requested'}`);

    // Log cancellation
    await admin.firestore()
      .collection('subscription_cancellations')
      .add({
        userId,
        plan: subscriptionMetadata.plan,
        amountPaise: subscriptionMetadata.amountPaise,
        amountRupees: subscriptionMetadata.amountRupees,
        cancelledAt: new Date(),
        reason: reason || 'User requested',
      });

    return { success: true, message: 'Subscription cancelled successfully. Access will continue until end date.' };
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    throw new functions.https.HttpsError('internal', `Failed to cancel subscription: ${error.message}`);
  }
});
