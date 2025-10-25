import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Observable, map, filter, take, from, switchMap } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { UserOnboardingCacheService } from '../services/user-onboarding-cache.service';

// No longer needed as we use LoadingService to wait for auth initialization

/**
 * Wait for Firebase Auth to initialize and allow navigation only if a user is logged in.
 * Use this as canActivate for already-routed features if needed.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);
  const loadingService = inject(LoadingService);

  return loadingService.isLoading$.pipe(
    // Wait until loading is complete
    filter(isLoading => !isLoading),
    take(1),
    map(() => {
      const user = auth.currentUser;
      return user ? true : router.createUrlTree(['/login']);
    })
  );
};

/**
 * Prefer this for guarding feature routes to avoid flicker during initial navigation.
 * Router will not match the route until the observable resolves.
 * Checks both Firebase Auth AND Firestore user document existence.
 * Uses in-memory cache to minimize Firestore reads.
 */
export const authCanMatch: CanMatchFn = (route, segments: UrlSegment[]) => {
  const router = inject(Router);
  const auth = inject(Auth);
  const loadingService = inject(LoadingService);
  const onboardingCache = inject(UserOnboardingCacheService);
  
  return loadingService.isLoading$.pipe(
    // Wait until loading is complete
    filter(isLoading => !isLoading),
    take(1),
    switchMap(() => {
      const user = auth.currentUser;
      if (!user) {
        // No Firebase Auth user, redirect to login
        const url = '/' + segments.map(segment => segment.path).join('/');
        return from(Promise.resolve(router.createUrlTree(['/login'], { 
          queryParams: { returnUrl: url }
        })));
      }
      
      // User is authenticated, check if Firestore document exists (cached)
      return from(onboardingCache.hasCompletedOnboarding(user.uid)).pipe(
        map(hasCompleted => {
          if (hasCompleted) {
            // User has completed onboarding, allow access
            return true;
          } else {
            // User authenticated but hasn't completed onboarding
            // Redirect to onboarding with email pre-filled
            return router.createUrlTree(['/onboarding'], {
              queryParams: { email: user.email || '' }
            });
          }
        })
      );
    })
  );
};

/**
 * Guard for the login route: only redirect fully onboarded users away.
 * Allows access for logged out users AND authenticated users without Firestore doc.
 * This enables the back button from onboarding to work naturally.
 * Uses in-memory cache to minimize Firestore reads.
 */
export const loggedOutOnlyGuard: CanMatchFn = (route, segments) => {
  const router = inject(Router);
  const auth = inject(Auth);
  const loadingService = inject(LoadingService);
  const onboardingCache = inject(UserOnboardingCacheService);
  
  return loadingService.isLoading$.pipe(
    // Wait until loading is complete
    filter(isLoading => !isLoading),
    take(1),
    switchMap(() => {
      const user = auth.currentUser;
      if (!user) {
        // No user, allow access to login/register pages
        return from(Promise.resolve(true));
      }
      
      // User is authenticated, check if Firestore document exists (cached)
      return from(onboardingCache.hasCompletedOnboarding(user.uid)).pipe(
        map(hasCompleted => {
          if (hasCompleted) {
            // User has completed onboarding, redirect to discover or return URL
            const returnUrl = router.getCurrentNavigation()?.extractedUrl.queryParams['returnUrl'] || '/discover';
            return router.createUrlTree([returnUrl]);
          } else {
            // User authenticated but hasn't completed onboarding
            // Allow them to access login page (for logout or changing account)
            return true;
          }
        })
      );
    })
  );
}
