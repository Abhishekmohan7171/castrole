import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Scheduled Deletion Service
 * Runs daily to permanently delete accounts after grace period expires
 */

/**
 * Scheduled Cloud Function - Runs every day at 2 AM UTC
 * Processes accounts with expired grace period
 */
export const processScheduledDeletions = functions.pubsub
  .schedule('0 2 * * *') // Runs daily at 2 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting scheduled deletion process...');

    const now = admin.firestore.Timestamp.now();

    try {
      // Find users with expired grace period
      const usersToDelete = await admin
        .firestore()
        .collection('users')
        .where('deleteAccount', '==', true)
        .where('deleteAccountDate', '<=', now)
        .get();

      if (usersToDelete.empty) {
        console.log('No accounts to delete at this time');
        return null;
      }

      console.log(`Found ${usersToDelete.size} account(s) to delete`);

      // Process each deletion
      const deletionPromises = usersToDelete.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        const userData = userDoc.data();

        try {
          console.log(`Processing deletion for user: ${uid} (${userData.email})`);

          // Delete all user data
          await deleteUserData(uid);

          // Delete Firebase Auth account (this will also trigger auth state changes)
          try {
            await admin.auth().deleteUser(uid);
            console.log(`✅ Successfully deleted Firebase Auth account: ${uid}`);
          } catch (authError: any) {
            // If user already deleted or doesn't exist, that's fine
            if (authError.code === 'auth/user-not-found') {
              console.log(`Auth account already deleted: ${uid}`);
            } else {
              throw authError;
            }
          }

          console.log(`✅ Successfully deleted user: ${uid}`);
        } catch (error) {
          console.error(`❌ Failed to delete user ${uid}:`, error);
          // Continue with other deletions even if one fails
        }
      });

      await Promise.all(deletionPromises);

      console.log('Scheduled deletion process completed');
      return null;
    } catch (error) {
      console.error('Error in scheduled deletion process:', error);
      throw error;
    }
  });

/**
 * Comprehensive data deletion for a user
 * Deletes all Firestore documents, Storage files, and related data
 */
async function deleteUserData(uid: string): Promise<void> {
  console.log(`Starting data deletion for user: ${uid}`);

  const firestore = admin.firestore();
  const storage = admin.storage();

  // 1. Delete user document
  try {
    await firestore.collection('users').doc(uid).delete();
    console.log(`  ✅ Deleted user document: ${uid}`);
  } catch (error) {
    console.error(`  ❌ Failed to delete user document:`, error);
  }

  // 2. Delete profile document (includes both Actor and Producer data)
  try {
    await firestore.collection('profiles').doc(uid).delete();
    console.log(`  ✅ Deleted profile document: ${uid}`);
  } catch (error) {
    console.error(`  ❌ Failed to delete profile document:`, error);
  }

  // 3. Delete all Storage files for this user
  try {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });

    if (files.length > 0) {
      console.log(`  📦 Deleting ${files.length} storage files...`);
      await Promise.all(files.map((file) => file.delete()));
      console.log(`  ✅ Deleted all storage files for user: ${uid}`);
    } else {
      console.log(`  ℹ️  No storage files found for user: ${uid}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to delete storage files:`, error);
  }

  // 4. Handle chat rooms - remove user from participants or delete if empty
  try {
    const chatRoomsQuery = await firestore
      .collection('chatRooms')
      .where('participants', 'array-contains', uid)
      .get();

    if (!chatRoomsQuery.empty) {
      console.log(`  💬 Processing ${chatRoomsQuery.size} chat room(s)...`);

      const chatPromises = chatRoomsQuery.docs.map(async (chatDoc) => {
        const participants = chatDoc.data().participants || [];

        if (participants.length <= 2) {
          // Delete entire chat room if only 2 participants (1-on-1 chat)
          await chatDoc.ref.delete();
          console.log(`    ✅ Deleted chat room: ${chatDoc.id}`);
        } else {
          // Remove user from participants in group chats
          await chatDoc.ref.update({
            participants: admin.firestore.FieldValue.arrayRemove(uid),
          });
          console.log(`    ✅ Removed user from chat room: ${chatDoc.id}`);
        }
      });

      await Promise.all(chatPromises);
      console.log(`  ✅ Processed all chat rooms for user: ${uid}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to process chat rooms:`, error);
  }

  // 5. Delete user analytics data
  try {
    const analyticsDoc = firestore.collection('user_analytics').doc(uid);
    const analyticsSnapshot = await analyticsDoc.get();

    if (analyticsSnapshot.exists) {
      await analyticsDoc.delete();
      console.log(`  ✅ Deleted analytics data for user: ${uid}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to delete analytics data:`, error);
  }

  // 6. Remove user from other users' wishlists (Producer feature)
  try {
    const profilesWithWishlist = await firestore
      .collection('profiles')
      .where('producerProfile.wishList', 'array-contains', uid)
      .get();

    if (!profilesWithWishlist.empty) {
      console.log(
        `  ⭐ Removing user from ${profilesWithWishlist.size} wishlist(s)...`
      );

      const wishlistPromises = profilesWithWishlist.docs.map((profile) =>
        profile.ref.update({
          'producerProfile.wishList': admin.firestore.FieldValue.arrayRemove(uid),
        })
      );

      await Promise.all(wishlistPromises);
      console.log(`  ✅ Removed user from all wishlists`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to remove from wishlists:`, error);
  }

  // 7. Delete user uploads collection (if exists)
  try {
    const uploadsRef = firestore
      .collection('uploads')
      .doc(uid)
      .collection('userUploads');

    const uploadsSnapshot = await uploadsRef.get();

    if (!uploadsSnapshot.empty) {
      console.log(`  📤 Deleting ${uploadsSnapshot.size} upload document(s)...`);

      const uploadDeletePromises = uploadsSnapshot.docs.map((doc) =>
        doc.ref.delete()
      );
      await Promise.all(uploadDeletePromises);

      // Delete the parent uploads document
      await firestore.collection('uploads').doc(uid).delete();

      console.log(`  ✅ Deleted all uploads for user: ${uid}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to delete uploads:`, error);
  }

  console.log(`✅ Successfully cleaned up all data for user: ${uid}`);
}

/**
 * Scheduled Cloud Function - Sends reminder emails
 * Runs daily at 10 AM UTC
 */
export const sendDeletionReminders = functions.pubsub
  .schedule('0 10 * * *') // Runs daily at 10 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting deletion reminder email process...');

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in7DaysEnd = new Date(in7Days.getTime() + 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

    try {
      // Import email service
      const { sendDeletionReminderEmail } = await import('./emailService');

      // Find users with deletion in 7 days
      const sevenDayUsers = await admin
        .firestore()
        .collection('users')
        .where('deleteAccount', '==', true)
        .where(
          'deleteAccountDate',
          '>=',
          admin.firestore.Timestamp.fromDate(in7Days)
        )
        .where(
          'deleteAccountDate',
          '<',
          admin.firestore.Timestamp.fromDate(in7DaysEnd)
        )
        .get();

      console.log(`Found ${sevenDayUsers.size} user(s) with 7 days remaining`);

      for (const userDoc of sevenDayUsers.docs) {
        try {
          const userData = userDoc.data();
          await sendDeletionReminderEmail(
            userData.email,
            userData.name || 'User',
            7,
            userData.deleteAccountDate.toDate()
          );
        } catch (error) {
          console.error(`Failed to send 7-day reminder to ${userDoc.id}:`, error);
        }
      }

      // Find users with deletion tomorrow
      const oneDayUsers = await admin
        .firestore()
        .collection('users')
        .where('deleteAccount', '==', true)
        .where(
          'deleteAccountDate',
          '>=',
          admin.firestore.Timestamp.fromDate(tomorrow)
        )
        .where(
          'deleteAccountDate',
          '<',
          admin.firestore.Timestamp.fromDate(tomorrowEnd)
        )
        .get();

      console.log(`Found ${oneDayUsers.size} user(s) with 1 day remaining`);

      for (const userDoc of oneDayUsers.docs) {
        try {
          const userData = userDoc.data();
          await sendDeletionReminderEmail(
            userData.email,
            userData.name || 'User',
            1,
            userData.deleteAccountDate.toDate()
          );
        } catch (error) {
          console.error(`Failed to send 1-day reminder to ${userDoc.id}:`, error);
        }
      }

      console.log('Deletion reminder email process completed');
      return null;
    } catch (error) {
      console.error('Error in deletion reminder process:', error);
      throw error;
    }
  });
