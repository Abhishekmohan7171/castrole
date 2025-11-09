import { Firestore, collection, query, where, getDocs, limit, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { ProfileUrlService } from '../services/profile-url.service';
import { Profile } from '../../assets/interfaces/profile.interfaces';

/**
 * Generate and save a unique slug-uid for a profile
 * This should be called ONCE when a profile is created
 * 
 * @param firestore - Firestore instance
 * @param profileUrlService - ProfileUrlService instance
 * @param uid - User's Firebase UID
 * @param name - User's display name (stageName for actors, name for producers)
 * @returns The generated slug-uid
 */
export async function generateAndSaveSlugUid(
  firestore: Firestore,
  profileUrlService: ProfileUrlService,
  uid: string,
  name: string
): Promise<string> {
  // Generate slug-uid
  const slugUid = profileUrlService.generateSlugUid(name, uid);
  
  console.log('Generated slug-uid for profile:', slugUid);
  
  // Check if it already exists (should be unique due to UID, but check anyway)
  const profilesRef = collection(firestore, 'profiles');
  const existingQuery = query(profilesRef, where('slug', '==', slugUid), limit(1));
  const existing = await getDocs(existingQuery);
  
  if (!existing.empty) {
    console.warn('Slug-uid already exists (this should not happen):', slugUid);
    // If it exists, add a random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const newSlugUid = `${slugUid}-${randomSuffix}`;
    console.log('Using modified slug-uid:', newSlugUid);
    return newSlugUid;
  }
  
  // Save slug-uid to profile
  const profileRef = doc(firestore, 'profiles', uid);
  await updateDoc(profileRef, {
    slug: slugUid
  });
  
  console.log('Slug-uid saved to profile:', slugUid);
  
  return slugUid;
}

/**
 * Check if a profile has a slug-uid, if not generate and save one
 * Useful for migrating existing profiles
 * 
 * @param firestore - Firestore instance
 * @param profileUrlService - ProfileUrlService instance
 * @param profile - Profile data
 * @param name - User's display name
 * @returns The slug-uid (existing or newly generated)
 */
export async function ensureProfileHasSlugUid(
  firestore: Firestore,
  profileUrlService: ProfileUrlService,
  profile: Profile,
  name: string
): Promise<string> {
  // If profile already has a slug, return it
  if (profile.slug) {
    console.log('Profile already has slug-uid:', profile.slug);
    return profile.slug;
  }
  
  // Generate and save new slug-uid
  console.log('Profile missing slug-uid, generating...');
  return await generateAndSaveSlugUid(firestore, profileUrlService, profile.uid, name);
}
