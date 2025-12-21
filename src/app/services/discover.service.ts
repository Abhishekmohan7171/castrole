import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Discover, PostType } from '../../assets/interfaces/discover.interface';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class DiscoverService {
  private firestore = inject(Firestore);
  private logger = inject(LoggerService);
  private discoverCollection = collection(this.firestore, 'discover');

  /**
   * Get all active discover posts with real-time updates
   * @param category Optional category filter ('all', 'academic', 'news', 'trending')
   * @param limitCount Maximum number of posts to fetch
   */
  getDiscoverPosts(
    category?: string,
    limitCount: number = 50
  ): Observable<Discover[]> {
    return new Observable<Discover[]>((observer) => {
      try {
        // Build query
        let q = query(
          this.discoverCollection,
          where('isActive', '==', true),
          orderBy('postDate', 'desc'),
          limit(limitCount)
        );

        // Add category filter if provided and not 'all'
        if (category && category !== 'all') {
          q = query(
            this.discoverCollection,
            where('isActive', '==', true),
            where('category', '==', category),
            orderBy('postDate', 'desc'),
            limit(limitCount)
          );
        }

        // Set up real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const posts: Discover[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              const post = this.mapFirestoreToDiscover(doc.id, data);
              if (post) {
                posts.push(post);
              }
            });

            this.logger.log(
              `Fetched ${posts.length} discover posts${category ? ` for category: ${category}` : ''}`
            );
            observer.next(posts);
          },
          (error) => {
            this.logger.error('Error fetching discover posts:', error);
            observer.error(error);
          }
        );

        // Return cleanup function
        return () => unsubscribe();
      } catch (error) {
        this.logger.error('Error setting up discover posts listener:', error);
        observer.error(error);
        return () => {}; // Return empty cleanup function on error
      }
    });
  }

  /**
   * Get featured discover posts
   */
  getFeaturedPosts(limitCount: number = 10): Observable<Discover[]> {
    return new Observable<Discover[]>((observer) => {
      try {
        const q = query(
          this.discoverCollection,
          where('isActive', '==', true),
          where('isFeatured', '==', true),
          orderBy('postDate', 'desc'),
          limit(limitCount)
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const posts: Discover[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              const post = this.mapFirestoreToDiscover(doc.id, data);
              if (post) {
                posts.push(post);
              }
            });

            this.logger.log(`Fetched ${posts.length} featured posts`);
            observer.next(posts);
          },
          (error) => {
            this.logger.error('Error fetching featured posts:', error);
            observer.error(error);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        this.logger.error('Error setting up featured posts listener:', error);
        observer.error(error);
        return () => {}; // Return empty cleanup function on error
      }
    });
  }

  /**
   * Get discover posts by specific type
   */
  getPostsByType(
    postType: PostType,
    limitCount: number = 20
  ): Observable<Discover[]> {
    return new Observable<Discover[]>((observer) => {
      try {
        const q = query(
          this.discoverCollection,
          where('isActive', '==', true),
          where('type', '==', postType),
          orderBy('postDate', 'desc'),
          limit(limitCount)
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const posts: Discover[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              const post = this.mapFirestoreToDiscover(doc.id, data);
              if (post) {
                posts.push(post);
              }
            });

            this.logger.log(
              `Fetched ${posts.length} posts of type: ${postType}`
            );
            observer.next(posts);
          },
          (error) => {
            this.logger.error(
              `Error fetching posts by type ${postType}:`,
              error
            );
            observer.error(error);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        this.logger.error('Error setting up posts by type listener:', error);
        observer.error(error);
        return () => {}; // Return empty cleanup function on error
      }
    });
  }

  /**
   * Map Firestore document data to Discover interface
   */
  private mapFirestoreToDiscover(
    id: string,
    data: DocumentData
  ): Discover | null {
    try {
      return {
        id: id,
        authorId: data['authorId'] || undefined,
        authorName: data['authorName'] || undefined,
        postDate: this.convertTimestamp(data['postDate']),
        content: data['content'] || data['description'] || '',
        title: data['title'] || undefined,
        subtitle: data['subtitle'] || undefined,
        description: data['description'] || undefined,
        imageUrl: data['imageUrl'] || undefined,
        videoUrl: data['videoUrl'] || undefined,
        fileUrl: data['fileUrl'] || undefined,
        customUrl: data['customUrl'] || undefined,
        thumbnailUrl: data['thumbnailUrl'] || undefined,
        category: data['category'] || undefined,
        tags: data['tags'] || undefined,
        type: data['type'] || PostType.text,
        isFeatured: data['isFeatured'] || false,
        location: data['location'] || undefined,
        metadata: data['metadata'] || undefined,
        isActive: data['isActive'] || false,
        createdAt: this.convertTimestamp(data['createdAt']),
        updatedAt: this.convertTimestamp(data['updatedAt']),
        expiryDate: data['expiryDate'] ? this.convertTimestamp(data['expiryDate']) : undefined,
      };
    } catch (error) {
      this.logger.error('Error mapping Firestore data to Discover:', error);
      return null;
    }
  }

  /**
   * Convert Firestore Timestamp to JavaScript Date
   */
  private convertTimestamp(timestamp: any): Date {
    if (!timestamp) {
      return new Date();
    }

    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // If it's a Firestore Timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // If it's a timestamp object with seconds
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }

    // Fallback: try to parse as string or number
    try {
      return new Date(timestamp);
    } catch {
      return new Date();
    }
  }
}
