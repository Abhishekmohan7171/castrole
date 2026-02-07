import * as functions from 'firebase-functions';
import { sendDeletionConfirmationEmail } from './emailService';

/**
 * Firestore Trigger - Account Deletion Requested
 * Sends confirmation email when user requests account deletion
 */
export const onAccountDeletionRequested = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if deleteAccount was just set to true
    if (!before.deleteAccount && after.deleteAccount) {
      console.log(
        `Account deletion requested for user: ${context.params.userId}`
      );

      try {
        const deletionDate = after.deleteAccountDate.toDate();
        const email = after.email;
        const name = after.name || 'User';

        // Send confirmation email
        await sendDeletionConfirmationEmail(email, name, deletionDate);

        console.log(
          `✅ Deletion confirmation email sent to ${email} (${context.params.userId})`
        );
      } catch (error) {
        console.error(
          `❌ Failed to send deletion confirmation email for ${context.params.userId}:`,
          error
        );
        // Don't throw - we don't want to fail the deletion request if email fails
      }
    }

    return null;
  });
