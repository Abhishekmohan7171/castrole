import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, UploadTask } from '@angular/fire/storage';
import { 
  Firestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  QueryConstraint 
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

export interface MediaUpload {
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'video' | 'image';
  fileSize: number;
  uploadedAt: any;
  metadata?: VideoMetadata | ImageMetadata;
}

export interface VideoMetadata {
  tags: string[];
  mediaType: string;
  description: string;
  thumbnailUrl?: string;
}

export interface ImageMetadata {
  caption?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private storage = inject(Storage);
  private db = inject(Firestore);
  private auth = inject(Auth);

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
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name
        }
      });

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({ progress });
        },
        (error) => {
          observer.error({ error: error.message });
          observer.complete();
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save metadata to Firestore
            await this.saveMediaMetadata({
              userId: user.uid,
              fileName: file.name,
              fileUrl: downloadURL,
              fileType: 'video',
              fileSize: file.size,
              uploadedAt: serverTimestamp(),
              metadata
            });

            observer.next({ progress: 100, url: downloadURL });
            observer.complete();
          } catch (error: any) {
            observer.error({ error: error.message });
            observer.complete();
          }
        }
      );
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
            originalName: file.name
          }
        });

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            uploadProgress[index].progress = 
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            observer.next([...uploadProgress]);
          },
          (error) => {
            uploadProgress[index].error = error.message;
            observer.next([...uploadProgress]);
            completedUploads++;
            if (completedUploads === files.length) {
              observer.complete();
            }
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              uploadProgress[index].url = downloadURL;
              uploadProgress[index].progress = 100;
              
              // Save metadata to Firestore
              await this.saveMediaMetadata({
                userId: user.uid,
                fileName: file.name,
                fileUrl: downloadURL,
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
              uploadProgress[index].error = error.message;
              observer.next([...uploadProgress]);
              completedUploads++;
              if (completedUploads === files.length) {
                observer.complete();
              }
            }
          }
        );
      });
    });
  }

  /**
   * Save media metadata to Firestore
   * @param data Media upload data
   */
  private async saveMediaMetadata(data: MediaUpload): Promise<void> {
    await addDoc(collection(this.db, 'uploads'), data);
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
   * Get uploads by user ID
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
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    ];

    if (fileType) {
      constraints.splice(1, 0, where('fileType', '==', fileType));
    }

    const q = query(collection(this.db, 'uploads'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  }

  /**
   * Get uploads by media type (for videos only)
   * @param mediaType Media type to filter by (reel, short, scene, etc.)
   * @param limitCount Optional limit for number of results
   * @returns Promise of MediaUpload array
   */
  async getUploadsByMediaType(
    mediaType: string,
    limitCount: number = 50
  ): Promise<MediaUpload[]> {
    const q = query(
      collection(this.db, 'uploads'),
      where('fileType', '==', 'video'),
      where('metadata.mediaType', '==', mediaType),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  }

  /**
   * Get uploads by tag
   * @param tag Tag to search for
   * @param limitCount Optional limit for number of results
   * @returns Promise of MediaUpload array
   */
  async getUploadsByTag(
    tag: string,
    limitCount: number = 50
  ): Promise<MediaUpload[]> {
    const q = query(
      collection(this.db, 'uploads'),
      where('fileType', '==', 'video'),
      where('metadata.tags', 'array-contains', tag),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  }

  /**
   * Get recent uploads across all users
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

    const q = query(collection(this.db, 'uploads'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  }
}
