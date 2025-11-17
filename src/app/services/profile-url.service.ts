import { Injectable } from '@angular/core';

/**
 * Service for generating and parsing profile URLs using stored slug-uid
 * Format: /discover/:slug-uid (stored in database, never changes)
 * Example: /discover/rajkumar-rao-xK9mP2nQ7R
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileUrlService {

  /**
   * Generate a profile URL from stored slug-uid
   * @param slugUid - Stored slug-uid from profile (e.g., "rajkumar-rao-xK9mP2nQ7R")
   * @returns Profile URL path (e.g., "/discover/rajkumar-rao-xK9mP2nQ7R")
   */
  generateProfileUrl(slugUid: string): string {
    return `/discover/${slugUid}`;
  }

  /**
   * Generate a NEW slug-uid for profile creation (called once)
   * @param name - User's display name (stageName for actors, name for producers)
   * @param uid - User's Firebase UID
   * @returns Slug-UID string (e.g., "rajkumar-rao-xK9mP2nQ7R")
   */
  generateSlugUid(name: string, uid: string): string {
    const slug = this.generateSlug(name);
    const shortUid = this.getShortUid(uid);
    return `${slug}-${shortUid}`;
  }

  /**
   * Extract UID from a slug-uid parameter
   * @param slugUid - Combined slug-uid string
   * @returns Extracted UID or null if invalid
   */
  extractUid(slugUid: string): string | null {
    if (!slugUid || typeof slugUid !== 'string') {
      return null;
    }

    // Find the last dash separator
    const lastDashIndex = slugUid.lastIndexOf('-');
    
    if (lastDashIndex === -1) {
      return null;
    }
    
    const uid = slugUid.substring(lastDashIndex + 1);
    
    // Validate UID format (should be at least 10 characters)
    if (uid.length < 10) {
      return null;
    }
    
    return uid;
  }

  /**
   * Validate if a slug-uid is in correct format
   * @param slugUid - Slug-UID string to validate
   * @returns True if valid format
   */
  isValidSlugUid(slugUid: string): boolean {
    const uid = this.extractUid(slugUid);
    return uid !== null && uid.length >= 10;
  }

  /**
   * Generate a URL-safe slug from a name
   * @param name - User's display name
   * @returns URL-safe slug
   */
  private generateSlug(name: string): string {
    if (!name) {
      return 'user';
    }

    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')           // Replace spaces with dashes
      .replace(/-+/g, '-')            // Remove consecutive dashes
      .replace(/^-+|-+$/g, '')        // Trim dashes from start/end
      .substring(0, 50)               // Limit length to 50 chars
      || 'user';                      // Fallback if empty
  }

  /**
   * Get shortened UID for URLs (last 12 characters)
   * @param uid - Full Firebase UID
   * @returns Shortened UID
   */
  private getShortUid(uid: string): string {
    const shortLength = 12;
    return uid.length > shortLength 
      ? uid.substring(uid.length - shortLength)
      : uid;
  }

}
