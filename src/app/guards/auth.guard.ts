import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Observable, map, filter, take } from 'rxjs';
import { LoadingService } from '../services/loading.service';

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
 */
export const authCanMatch: CanMatchFn = (route, segments: UrlSegment[]) => {
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
 * Guard for the login route: if user is already logged in, redirect to /discover.
 * Prevents momentary navigation to /login on reload when session is valid.
 */
export const loggedOutOnlyGuard: CanMatchFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);
  const loadingService = inject(LoadingService);
  
  return loadingService.isLoading$.pipe(
    // Wait until loading is complete
    filter(isLoading => !isLoading),
    take(1),
    map(() => {
      const user = auth.currentUser;
      return user ? router.createUrlTree(['/discover']) : true;
    })
  );
};
