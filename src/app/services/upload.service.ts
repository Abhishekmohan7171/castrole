import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, UploadTask } from '@angular/fire/storage';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  collectionGroup,
  QueryConstraint
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UploadProgress, MediaUpload, VideoMetadata, ImageMetadata } from '../../assets/interfaces/interfaces';
import { VideoCompressionService } from './video-compression.service';


@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private storage = inject(Storage);
  private db = inject(Firestore);
  private auth = inject(Auth);
  private videoCompressionService = inject(VideoCompressionService);

  /**
   * Upload a video file to Firebase Storage and save metadata to Firestore
   * @param file Video file to upload
   * @param metadata Video metadata (tags, description, etc.)
   * @returns Observable of upload progress
   */
  uploadVideo(
    file: File,
    metadata: VideoMetadata
  ): Observable<UploadProgress> {
    return new Observable<UploadProgress>(observer => {
      const user = this.auth.currentUser;
      if (!user) {
        observer.error({ error: 'User not authenticated' });
        observer.complete();
        return;
      }

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const sanitizedFileName = this.sanitizeFileName(file.name);
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `users/${user.uid}/videos/${fileName}`;
      
      // Create storage reference
      const storageRef = ref(this.storage, filePath);
      
      // Start upload with resumable upload for heavy files
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name,
          uploadTimestamp: timestamp.toString()
        }
      });

      // Monitor upload progress
      const unsubscribe = uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({ progress });
        },
        (error) => {
          // Enhanced error handling
          let errorMessage = error.message || 'Upload failed';
          if (error.code === 'storage/canceled') {
            errorMessage = 'Upload was cancelled';
          } else if (error.code === 'storage/quota-exceeded') {
            errorMessage = 'Storage quota exceeded';
          } else if (error.code === 'storage/unauthenticated') {
            errorMessage = 'Authentication required';
          }
          observer.error({ error: errorMessage });
          observer.complete();
        },
        async () => {
          try {
            // Get download URL with retry logic for heavy uploads
            let downloadURL: string;
            let retries = 3;
            while (retries > 0) {
              try {
                downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                break;
              } catch (error: any) {
                retries--;
                if (retries === 0) throw error;
                // Wait 1 second before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            // Save metadata to Firestore
            await this.saveMediaMetadata({
              userId: user.uid,
              fileName: file.name,
              fileUrl: downloadURL!,
              fileType: 'video',
              fileSize: file.size,
              uploadedAt: serverTimestamp(),
              metadata
            });

            observer.next({ progress: 100, url: downloadURL! });
            observer.complete();
          } catch (error: any) {
            observer.error({ error: error.message || 'Failed to finalize upload' });
            observer.complete();
          }
        }
      );

      // Return teardown logic to cancel upload if observable is unsubscribed
      return () => {
        if (uploadTask.snapshot.state === 'running') {
          uploadTask.cancel();
        }
      };
    });
  }

  /**
   * Upload multiple image files to Firebase Storage
   * @param files Array of image files
   * @param metadata Optional image metadata
   * @returns Observable array of upload progress for each file
   */
  uploadImages(
    files: File[],
    metadata?: ImageMetadata
  ): Observable<UploadProgress[]> {
    return new Observable<UploadProgress[]>(observer => {
      const user = this.auth.currentUser;
      if (!user) {
        observer.error([{ progress: 0, error: 'User not authenticated' }]);
        observer.complete();
        return;
      }

      const uploadProgress: UploadProgress[] = files.map(() => ({ progress: 0 }));
      let completedUploads = 0;

      const uploadTasks: UploadTask[] = [];

      files.forEach((file, index) => {
        const timestamp = Date.now();
        const sanitizedFileName = this.sanitizeFileName(file.name);
        const fileName = `${timestamp}_${index}_${sanitizedFileName}`;
        const filePath = `users/${user.uid}/images/${fileName}`;
        
        const storageRef = ref(this.storage, filePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          customMetadata: {
            uploadedBy: user.uid,
            originalName: file.name,
            uploadTimestamp: timestamp.toString()
          }
        });

        uploadTasks.push(uploadTask);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            uploadProgress[index].progress = 
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            observer.next([...uploadProgress]);
          },
          (error) => {
            // Enhanced error handling
            let errorMessage = error.message || 'Upload failed';
            if (error.code === 'storage/canceled') {
              errorMessage = 'Upload was cancelled';
            } else if (error.code === 'storage/quota-exceeded') {
              errorMessage = 'Storage quota exceeded';
            }
            uploadProgress[index].error = errorMessage;
            observer.next([...uploadProgress]);
            completedUploads++;
            if (completedUploads === files.length) {
              observer.complete();
            }
          },
          async () => {
            try {
              // Get download URL with retry for heavy images
              let downloadURL: string;
              let retries = 3;
              while (retries > 0) {
                try {
                  downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  break;
                } catch (error: any) {
                  retries--;
                  if (retries === 0) throw error;
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }

              uploadProgress[index].url = downloadURL!;
              uploadProgress[index].progress = 100;
              
              // Save metadata to Firestore
              await this.saveMediaMetadata({
                userId: user.uid,
                fileName: file.name,
                fileUrl: downloadURL!,
                fileType: 'image',
                fileSize: file.size,
                uploadedAt: serverTimestamp(),
                metadata
              });

              observer.next([...uploadProgress]);
              completedUploads++;
              
              if (completedUploads === files.length) {
                observer.complete();
              }
            } catch (error: any) {
              uploadProgress[index].error = error.message || 'Failed to finalize upload';
              observer.next([...uploadProgress]);
              completedUploads++;
              if (completedUploads === files.length) {
                observer.complete();
              }
            }
          }
        );
      });

      // Return teardown logic to cancel all uploads if observable is unsubscribed
      return () => {
        uploadTasks.forEach(task => {
          if (task.snapshot.state === 'running') {
            task.cancel();
          }
        });
      };
    });
  }

  /**
   * Save media metadata to Firestore using hierarchical structure
   * Path: /uploads/{userId}/userUploads/{uploadId}
   * @param data Media upload data (userId must be provided)
   */
  private async saveMediaMetadata(data: MediaUpload & { userId: string }): Promise<void> {
    const { metadata, userId, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };

    if (metadata !== undefined) {
      payload['metadata'] = Object.fromEntries(
        Object.entries(metadata).filter(([, value]) => value !== undefined)
      );
    }

    // Use hierarchical structure: /uploads/{userId}/userUploads/{auto-generated-id}
    const uploadsRef = collection(this.db, 'uploads', userId, 'userUploads');
    
    // Retry logic for Firestore writes (handles heavy load)
    let retries = 3;
    while (retries > 0) {
      try {
        await addDoc(uploadsRef, payload);
        return;
      } catch (error: any) {
        retries--;
        if (retries === 0) {
          throw new Error(`Failed to save metadata: ${error.message}`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Sanitize filename to remove special characters
   * @param fileName Original filename
   * @returns Sanitized filename
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Extract userId from document path
   * Path format: uploads/{userId}/userUploads/{uploadId}
   * @param docPath Document reference path
   * @returns userId or undefined
   */
  private extractUserIdFromPath(docPath: string): string | undefined {
    const pathParts = docPath.split('/');
    // Path format: uploads/{userId}/userUploads/{uploadId}
    if (pathParts.length >= 2 && pathParts[0] === 'uploads') {
      return pathParts[1];
    }
    return undefined;
  }

  /**
   * Validate file size
   * @param file File to validate
   * @param maxSizeMB Maximum size in MB
   * @returns true if valid, false otherwise
   */
  validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Validate file type
   * @param file File to validate
   * @param allowedTypes Array of allowed MIME types
   * @returns true if valid, false otherwise
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => file.type.startsWith(type));
  }

  /**
   * Validate video duration
   * @param file Video file to validate
   * @param maxDurationMinutes Maximum duration in minutes
   * @returns Promise with validation result
   */
  async validateVideoDuration(
    file: File,
    maxDurationMinutes: number
  ): Promise<{ valid: boolean; duration?: number; error?: string }> {
    try {
      const duration = await this.videoCompressionService.getVideoDuration(file);
      const maxSeconds = maxDurationMinutes * 60;

      if (duration > maxSeconds) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return {
          valid: false,
          duration,
          error: `Video duration must be less than ${maxDurationMinutes} minutes. Current: ${minutes}:${seconds.toString().padStart(2, '0')}`
        };
      }

      return { valid: true, duration };
    } catch (error: any) {
      return {
        valid: false,
        error: `Failed to read video duration: ${error.message}`
      };
    }
  }

  /**
   * Get uploads by user ID using hierarchical structure
   * Path: /uploads/{userId}/userUploads
   * @param userId User ID to filter by
   * @param fileType Optional file type filter ('video' | 'image')
   * @param limitCount Optional limit for number of results
   * @returns Promise of MediaUpload array
   */
  async getUserUploads(
    userId: string, 
    fileType?: 'video' | 'image',
    limitCount: number = 50
  ): Promise<MediaUpload[]> {
    const constraints: QueryConstraint[] = [
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    ];

    if (fileType) {
      constraints.unshift(where('fileType', '==', fileType));
    }

    // Query the user's specific subcollection
    const uploadsRef = collection(this.db, 'uploads', userId, 'userUploads');
    const q = query(uploadsRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, userId, ...doc.data() } as any));
  }

  /**
   * Get uploads by media type across all users using collectionGroup
   * @param mediaType Media type to filter by (reel, short, scene, etc.)
   * @param limitCount Optional limit for number of results
   * @returns Promise of MediaUpload array
   */
  async getUploadsByMediaType(
    mediaType: string,
    limitCount: number = 50
  ): Promise<MediaUpload[]> {
    // Use collectionGroup to query across all user subcollections
    const q = query(
      collectionGroup(this.db, 'userUploads'),
      where('fileType', '==', 'video'),
      where('metadata.mediaType', '==', mediaType),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId: this.extractUserIdFromPath(doc.ref.path),
      ...doc.data()
    } as any));
  }

  /**
   * Get uploads by tag across all users using collectionGroup
   * @param tag Tag to search for
   * @param limitCount Optional limit for number of results
   * @returns Promise of MediaUpload array
   */
  async getUploadsByTag(
    tag: string,
    limitCount: number = 50
  ): Promise<MediaUpload[]> {
    // Use collectionGroup to query across all user subcollections
    const q = query(
      collectionGroup(this.db, 'userUploads'),
      where('fileType', '==', 'video'),
      where('metadata.tags', 'array-contains', tag),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId: this.extractUserIdFromPath(doc.ref.path),
      ...doc.data()
    } as any));
  }

  /**
   * Get recent uploads across all users using collectionGroup
   * @param fileType Optional file type filter
   * @param limitCount Optional limit for number of results
   * @returns Promise of MediaUpload array
   */
  async getRecentUploads(
    fileType?: 'video' | 'image',
    limitCount: number = 50
  ): Promise<MediaUpload[]> {
    const constraints: QueryConstraint[] = [
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    ];

    if (fileType) {
      constraints.unshift(where('fileType', '==', fileType));
    }

    // Use collectionGroup to query across all user subcollections
    const q = query(collectionGroup(this.db, 'userUploads'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      userId: this.extractUserIdFromPath(doc.ref.path),
      ...doc.data()
    } as any));
  }
}
