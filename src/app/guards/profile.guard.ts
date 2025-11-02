import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Firestore, query, where, collection, getDocs, limit } from '@angular/fire/firestore';
import { Observable, map, from, of } from 'rxjs';
import { UserDoc } from '../../assets/interfaces/interfaces';

/**
 * Guard to check if a user profile is publicly accessible
 * Checks if the user exists and if they're an actor in ghost mode
 */
export const profileVisibilityGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const firestore = inject(Firestore);
  
  const username = route.paramMap.get('username');
  
  if (!username) {
    return router.createUrlTree(['/discover']);
  }

  // Query Firestore to find user by name
  const usersRef = collection(firestore, 'users');
  const userQuery = query(
    usersRef, 
    where('name', '==', username),
    limit(1)
  );

  return from(getDocs(userQuery)).pipe(
    map((querySnapshot) => {
      if (querySnapshot.empty) {
        // User not found, redirect to discover
        return router.createUrlTree(['/discover']);
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserDoc;

      // Check if user is an actor and has ghost mode enabled
      if (userData.roles?.includes('actor') && userData.ghost) {
        // Actor is in ghost mode, profile not accessible
        return router.createUrlTree(['/discover']);
      }

      // Profile is accessible
      return true;
    })
  );
};