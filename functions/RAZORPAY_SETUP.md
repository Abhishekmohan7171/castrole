# Razorpay Firebase Functions Setup Guide

## 🔐 Security First: Environment Variables

**CRITICAL**: Never commit Razorpay secrets to version control!

## Step 1: Get Your Razorpay Keys

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Generate keys for **Test Mode** first

You'll get:
- `key_id` (starts with `rzp_test_` for test mode)
- `key_secret` (keep this SECRET!)

## Step 2: Configure Firebase Functions

### For Local Development (Emulator)

Create `.runtimeconfig.json` in the `functions` folder:

```json
{
  "razorpay": {
    "key_id": "rzp_test_XXXXXXXXXXXXXXXX",
    "key_secret": "YOUR_TEST_SECRET_KEY",
    "webhook_secret": "YOUR_WEBHOOK_SECRET"
  }
}
```

**🔴 CRITICAL REQUIREMENTS:**
1. Add `.runtimeconfig.json` to `.gitignore`
2. **ALL THREE values must be set** - missing `webhook_secret` will break webhook verification
3. Get `webhook_secret` from Razorpay Dashboard → Settings → Webhooks after creating webhook
4. **NEVER skip webhook verification** - it's your final source of truth

### For Production Deployment

Use Firebase CLI to set environment variables:

```bash
# Navigate to project root
cd d:\Angular\castrole

# 🔴 CRITICAL: Set ALL three Razorpay configuration values
firebase functions:config:set \
  razorpay.key_id="rzp_test_XXXXXXXXXXXXXXXX" \
  razorpay.key_secret="YOUR_TEST_SECRET_KEY" \
  razorpay.webhook_secret="YOUR_WEBHOOK_SECRET"

# ⚠️ WARNING: Missing webhook_secret will cause webhook verification to FAIL
# Get webhook_secret from Razorpay Dashboard → Settings → Webhooks → Secret

# Verify all three values are set
firebase functions:config:get

# Expected output:
# {
#   "razorpay": {
#     "key_id": "rzp_test_...",
#     "key_secret": "...",
#     "webhook_secret": "..."  ← MUST be present
#   }
# }

# Deploy functions
firebase deploy --only functions
```

## Step 3: Update Client-Side Configuration

Update `src/app/config/razorpay.config.ts`:

```typescript
export const razorpayConfig = {
  keyId: 'rzp_test_XXXXXXXXXXXXXXXX', // Your actual test key_id
  // ... rest of config
};
```

## Step 4: Setup Razorpay Webhook

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Set URL: `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/razorpayWebhook`
4. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ payment.authorized
5. Set webhook secret and save
6. Update Firebase config with webhook secret (see Step 2)

## Step 5: Test Mode vs Production

### Test Mode (Development)
- Use `rzp_test_` keys
- Test cards: `4111 1111 1111 1111` (success)
- No real money charged

### Production Mode (Live)
- Use `rzp_live_` keys
- Real transactions
- Update both:
  - Firebase Functions config (server-side)
  - `razorpay.config.ts` (client-side key_id only)

## Verification Checklist

- [ ] Razorpay test keys obtained
- [ ] Firebase Functions config set (local or production)
- [ ] Client-side config updated with key_id
- [ ] `.runtimeconfig.json` added to `.gitignore`
- [ ] Webhook URL configured in Razorpay Dashboard
- [ ] Webhook secret set in Firebase config
- [ ] Functions deployed successfully
- [ ] Test payment completed successfully

## Security Notes

✅ **Safe to commit:**
- `razorpay.config.ts` (contains only public key_id)
- This setup guide

🚫 **NEVER commit:**
- `key_secret` (private key)
- `webhook_secret`
- `.runtimeconfig.json`

## Troubleshooting

### Error: "Missing Razorpay configuration"
- Run: `firebase functions:config:get`
- Verify `razorpay.key_id` and `razorpay.key_secret` are set

### Error: "Invalid signature"
- Check webhook secret matches in both Razorpay Dashboard and Firebase config
- Verify you're using the correct key_secret

### Error: "Payment verification failed"
- Ensure you're using matching test/production keys
- Check that order was created with same key_id being used for verification

## Next Steps

After setup is complete:
1. Install dependencies: `cd functions && npm install`
2. Test locally: `npm run serve` (starts emulator)
3. Deploy: `firebase deploy --only functions`
4. Test payment flow with Razorpay test cards
