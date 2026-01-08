# Cloud Functions Deployment Guide

## Overview

This guide covers the deployment and configuration of the account deletion Cloud Functions for Castrole.

## Functions Implemented

### 1. **onAccountDeletionRequested** (Firestore Trigger)
- **Trigger**: When `deleteAccount` field is set to `true` in a user document
- **Action**: Sends confirmation email with deletion date and reactivation link
- **File**: `functions/src/accountDeletionTrigger.ts`

### 2. **sendDeletionReminders** (Scheduled - Daily at 10 AM UTC)
- **Schedule**: Runs every day at 10:00 AM UTC
- **Action**: Sends reminder emails to users 7 days and 1 day before deletion
- **File**: `functions/src/scheduledDeletion.ts`

### 3. **processScheduledDeletions** (Scheduled - Daily at 2 AM UTC)
- **Schedule**: Runs every day at 2:00 AM UTC
- **Action**: Permanently deletes accounts after grace period expires
- **Deletes**:
  - Firestore documents (users, profiles, uploads, analytics)
  - Storage files (all user media)
  - Chat room references
  - Wishlist references
  - Firebase Auth account
- **File**: `functions/src/scheduledDeletion.ts`

---

## Prerequisites

### 1. Gmail App Password (for sending emails)

To send emails via Gmail, you need to create an App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail" → "Other (Custom name)"
5. Name it "Castrole Functions"
6. **Copy the 16-character password** (you'll need this in the next step)

**Important**: Use a dedicated email account for production (e.g., `noreply@castrole.com`), not a personal Gmail.

### 2. Firebase CLI

Make sure you have Firebase CLI installed and authenticated:

```bash
npm install -g firebase-tools
firebase login
```

---

## Configuration Steps

### Step 1: Set Email Configuration

In your project root directory, run:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
```

**Example**:
```bash
firebase functions:config:set email.user="noreply@castrole.com" email.password="abcd efgh ijkl mnop"
```

**Verify configuration**:
```bash
firebase functions:config:get
```

You should see:
```json
{
  "email": {
    "user": "noreply@castrole.com",
    "password": "abcd efgh ijkl mnop"
  }
}
```

### Step 2: Build TypeScript Functions

```bash
cd functions
npm run build
```

This compiles TypeScript to JavaScript in the `functions/lib` directory.

### Step 3: Deploy Functions

**Deploy all functions**:
```bash
firebase deploy --only functions
```

**Deploy specific functions** (useful for testing):
```bash
# Deploy only the deletion trigger
firebase deploy --only functions:onAccountDeletionRequested

# Deploy only scheduled deletions
firebase deploy --only functions:processScheduledDeletions

# Deploy only reminder emails
firebase deploy --only functions:sendDeletionReminders
```

---

## Testing

### Test 1: Confirmation Email (Firestore Trigger)

1. **Request account deletion from the app**:
   - Go to Settings → Delete Account
   - Confirm deletion

2. **Check logs**:
   ```bash
   firebase functions:log --only onAccountDeletionRequested
   ```

3. **Expected result**:
   - Confirmation email sent to user's email
   - Console log: "✅ Deletion confirmation email sent to..."

### Test 2: Reminder Emails (Manual Trigger)

Since reminders run on a schedule, you can manually trigger them for testing:

1. **Create a test user** with deletion scheduled for tomorrow or in 7 days:
   ```javascript
   // In Firestore console, set:
   deleteAccount: true
   deleteAccountDate: <timestamp 7 days from now>
   ```

2. **Manually invoke the function**:
   ```bash
   firebase functions:shell
   > sendDeletionReminders()
   ```

3. **Check email inbox** for reminder email

### Test 3: Scheduled Deletion (Manual Trigger)

**⚠️ WARNING**: This will permanently delete accounts. Test with dummy data only.

1. **Create a test user** with expired grace period:
   ```javascript
   // In Firestore console, set:
   deleteAccount: true
   deleteAccountDate: <timestamp in the past>
   ```

2. **Manually invoke the function**:
   ```bash
   firebase functions:shell
   > processScheduledDeletions()
   ```

3. **Verify deletion**:
   - User document deleted from Firestore
   - Storage files deleted
   - Firebase Auth account deleted

---

## Monitoring

### View Function Logs

```bash
# All function logs
firebase functions:log

# Specific function
firebase functions:log --only processScheduledDeletions

# Real-time logs
firebase functions:log --follow
```

### Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Navigate to **Functions** → See all deployed functions
4. Click on a function to view:
   - Execution logs
   - Error reports
   - Performance metrics

---

## Email Customization

### Update Email Templates

Edit the HTML templates in `functions/src/emailService.ts`:

**Confirmation Email** (lines 33-98):
- Change branding colors
- Update copy/messaging
- Modify button URLs

**Reminder Email** (lines 104-183):
- Adjust urgency messaging
- Customize countdown display
- Update support contact info

### Test Email Appearance

Use a tool like [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/) to test email rendering across different email clients.

---

## Production Checklist

- [ ] Set up dedicated email account (e.g., noreply@castrole.com)
- [ ] Generate Gmail App Password
- [ ] Configure Firebase Functions with email credentials
- [ ] Deploy all functions to production
- [ ] Test with dummy account (full flow)
- [ ] Monitor logs for first 24 hours
- [ ] Set up error alerts (Firebase Console → Functions → Alerts)
- [ ] Update email templates with production URLs
- [ ] Add privacy policy link to emails
- [ ] Configure email SPF/DKIM records (for better deliverability)

---

## Troubleshooting

### Emails Not Sending

**Check 1**: Verify email configuration
```bash
firebase functions:config:get
```

**Check 2**: Check function logs for errors
```bash
firebase functions:log --only onAccountDeletionRequested
```

**Common errors**:
- "Invalid login" → Wrong app password or 2FA not enabled
- "Configuration not found" → Email config not set
- "Network error" → Check Firebase project permissions

### Scheduled Functions Not Running

**Check 1**: Verify function is deployed
```bash
firebase functions:list
```

**Check 2**: Check Cloud Scheduler in Google Cloud Console
- Go to: https://console.cloud.google.com/cloudscheduler
- Look for scheduled functions
- Check execution history

### Deletion Not Completing

**Check 1**: Review logs for errors
```bash
firebase functions:log --only processScheduledDeletions
```

**Check 2**: Verify Firestore permissions
- Functions need admin access (already configured via `admin.initializeApp()`)

---

## Cost Considerations

### Function Invocations
- **onAccountDeletionRequested**: 1 per deletion request (~$0.40 per 1M invocations)
- **sendDeletionReminders**: 1 per day (~$0.012 per month)
- **processScheduledDeletions**: 1 per day (~$0.012 per month)

### Email Sending
- Gmail SMTP: **FREE** (up to 500 emails/day)
- For higher volume: Consider SendGrid, Mailgun, or AWS SES

### Storage & Networking
- Deleting files incurs minimal costs
- Network egress: ~$0.12/GB

**Estimated monthly cost for 1000 deletions**: ~$2-5

---

## Security Best Practices

1. **Never commit email credentials** to version control
2. **Use environment-specific configs** (dev vs. prod)
3. **Implement rate limiting** for deletion requests (app-level)
4. **Log all deletion operations** for audit trail
5. **Add email unsubscribe option** (for reminder emails)
6. **GDPR compliance**: Ensure data export before deletion

---

## Next Steps

1. **Deploy functions to staging/dev** environment first
2. **Test thoroughly** with dummy accounts
3. **Monitor logs** for 24-48 hours
4. **Deploy to production** when confident
5. **Set up monitoring alerts** for function failures
6. **Document email templates** for marketing team

---

## Support

If you encounter issues:

1. Check Firebase Functions logs: `firebase functions:log`
2. Review [Firebase Functions documentation](https://firebase.google.com/docs/functions)
3. Check [Nodemailer documentation](https://nodemailer.com/about/)
4. Contact Firebase Support via Console

---

## File Structure

```
functions/
├── src/
│   ├── index.ts                      # Main entry point (exports all functions)
│   ├── emailService.ts               # Email templates and sending logic
│   ├── accountDeletionTrigger.ts     # Firestore trigger for confirmation emails
│   └── scheduledDeletion.ts          # Scheduled functions for reminders and deletion
├── package.json                      # Dependencies (nodemailer added)
└── tsconfig.json                     # TypeScript configuration
```

---

## Summary

You've implemented a complete account deletion system with:
- ✅ Confirmation emails when deletion is requested
- ✅ Reminder emails (7 days and 1 day before deletion)
- ✅ Automatic permanent deletion after grace period
- ✅ Comprehensive data cleanup (Firestore + Storage + Auth)
- ✅ GDPR-compliant data export
- ✅ Self-service reactivation flow

**Next**: Configure email credentials → Deploy functions → Test with dummy account
