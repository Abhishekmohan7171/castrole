import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Storage, ref, listAll, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class DataExportService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  /**
   * Export all user data in JSON format
   * Includes: user document, profile, chat history, and media URLs
   */
  async exportUserData(uid: string): Promise<Blob> {
    try {
      const userData = await this.getUserData(uid);
      const profileData = await this.getProfileData(uid);
      const chatData = await this.getChatHistory(uid);
      const mediaUrls = await this.getMediaUrls(uid);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: userData,
        profile: profileData,
        chats: chatData,
        media: mediaUrls,
        metadata: {
          version: '1.0',
          format: 'castrole-data-export',
          exportedBy: uid,
        },
      };

      // Convert to JSON blob
      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('[DataExportService] Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Trigger browser download of the export blob
   */
  downloadExport(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Get user document from Firestore
   */
  private async getUserData(uid: string): Promise<any> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data();
      }

      return null;
    } catch (error) {
      console.error('[DataExportService] Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Get profile document from Firestore
   * Includes both Actor and Producer profiles if they exist
   */
  private async getProfileData(uid: string): Promise<any> {
    try {
      const profileDocRef = doc(this.firestore, 'profiles', uid);
      const profileDoc = await getDoc(profileDocRef);

      if (profileDoc.exists()) {
        return profileDoc.data();
      }

      return null;
    } catch (error) {
      console.error('[DataExportService] Error fetching profile data:', error);
      return null;
    }
  }

  /**
   * Get chat history from chatRooms collection
   * Returns all chats where user is a participant
   */
  private async getChatHistory(uid: string): Promise<any[]> {
    try {
      const chatsQuery = query(
        collection(this.firestore, 'chatRooms'),
        where('participants', 'array-contains', uid)
      );

      const chatDocs = await getDocs(chatsQuery);
      return chatDocs.docs.map((doc) => ({
        chatId: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[DataExportService] Error fetching chat history:', error);
      return [];
    }
  }

  /**
   * Get all media URLs from Firebase Storage
   * Returns array of download URLs for user's uploaded files
   */
  private async getMediaUrls(uid: string): Promise<string[]> {
    try {
      const urls: string[] = [];
      const storageRef = ref(this.storage, `users/${uid}`);

      // List all files in user's directory
      const fileList = await listAll(storageRef);

      // Get download URLs for all files
      for (const item of fileList.items) {
        try {
          const url = await getDownloadURL(item);
          urls.push(url);
        } catch (err) {
          console.warn(`[DataExportService] Could not get URL for ${item.fullPath}:`, err);
        }
      }

      // Also check subdirectories
      for (const folder of fileList.prefixes) {
        const subFiles = await listAll(folder);
        for (const item of subFiles.items) {
          try {
            const url = await getDownloadURL(item);
            urls.push(url);
          } catch (err) {
            console.warn(`[DataExportService] Could not get URL for ${item.fullPath}:`, err);
          }
        }
      }

      return urls;
    } catch (error) {
      console.error('[DataExportService] Error fetching media URLs:', error);
      return [];
    }
  }
}
