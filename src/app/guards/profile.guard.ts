import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, limit, doc, getDoc } from '@angular/fire/firestore';
import { map, from, switchMap } from 'rxjs';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { Profile } from '../../assets/interfaces/profile.interfaces';
import { ProfileUrlService } from '../services/profile-url.service';

/**
 * Guard to check if a user profile is publicly accessible
 * Checks if the profile exists and if the user is an actor in ghost mode
 * Works with stored slug-uid format (e.g., "rajkumar-rao-xK9mP2nQ7R")
 */
export const profileVisibilityGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const firestore = inject(Firestore);
  const profileUrlService = inject(ProfileUrlService);
  
  const slugUid = route.paramMap.get('slugUid');
  console.log('Guard - slugUid:', slugUid);
  
  if (!slugUid) {
    return router.createUrlTree(['/discover']);
  }

  // Query profiles collection by slug (which stores the full slug-uid)
  const profilesRef = collection(firestore, 'profiles');
  const profileQuery = query(profilesRef, where('slug', '==', slugUid), limit(1));

  return from(getDocs(profileQuery)).pipe(
    switchMap((querySnapshot) => {
      if (querySnapshot.empty) {
        // Profile not found by slug, try searching all profiles (for profiles without slug)
        console.log('Guard: Profile not found by slug, trying to find profile by partial UID match...');
        
        const shortUid = profileUrlService.extractUid(slugUid);
        
        if (!shortUid) {
          console.log('Guard: Invalid slug-uid format, redirecting');
          return from([router.createUrlTree(['/discover'])]);
        }
        
        // Query all profiles and find one where UID ends with shortUid
        const allProfilesQuery = query(collection(firestore, 'profiles'));
        return from(getDocs(allProfilesQuery)).pipe(
          switchMap((allProfiles) => {
            const matchingProfile = allProfiles.docs.find(doc => {
              const profile = doc.data() as Profile;
              return profile.uid.endsWith(shortUid);
            });
            
            if (!matchingProfile) {
              console.log('Guard: No profile found with matching UID suffix, redirecting');
              return from([router.createUrlTree(['/discover'])]);
            }
            
            const profileData = matchingProfile.data() as Profile;
            console.log('Guard: Profile found via UID suffix match:', profileData);
            
            // Get user data to check ghost mode
            const userDocRef = doc(firestore, 'users', profileData.uid);
            return from(getDoc(userDocRef)).pipe(
              map((userDoc) => {
                if (!userDoc.exists()) {
                  console.log('Guard: User not found, redirecting');
                  return router.createUrlTree(['/discover']);
                }
                
                const userData = userDoc.data() as UserDoc;
                console.log('Guard: User found:', userData);
                
                // Check ghost mode
                if (userData.roles?.includes('actor') && userData.ghost) {
                  console.log('Guard: Actor in ghost mode, redirecting');
                  return router.createUrlTree(['/discover']);
                }
                
                console.log('Guard: Profile accessible (via UID fallback)');
                return true;
              })
            );
          })
        );
      }

      const profileDoc = querySnapshot.docs[0];
      const profileData = profileDoc.data() as Profile;
      console.log('Guard: Profile found:', profileData);

      // Get user data by UID to check ghost mode
      const userDocRef = doc(firestore, 'users', profileData.uid);
      
      return from(getDoc(userDocRef)).pipe(
        map((userDoc) => {
          if (!userDoc.exists()) {
            console.log('Guard: User not found, redirecting');
            return router.createUrlTree(['/discover']);
          }

          const userData = userDoc.data() as UserDoc;
          console.log('Guard: User found:', userData);

          // Check if user is an actor and has ghost mode enabled
          if (userData.roles?.includes('actor') && userData.ghost) {
            console.log('Guard: Actor in ghost mode, redirecting');
            return router.createUrlTree(['/discover']);
          }

          // Profile is accessible
          console.log('Guard: Profile accessible, allowing navigation');
          return true;
        })
      );
    })
  );
};