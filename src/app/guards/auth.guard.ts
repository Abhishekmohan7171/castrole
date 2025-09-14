import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';

/**
 * Wait for Firebase Auth to initialize and allow navigation only if a user is logged in.
 * Use this as canActivate for already-routed features if needed.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);

  return authState(auth).pipe(
    take(1),
    map(user => (user ? true : router.createUrlTree(['/login'])))
  );
};

/**
 * Prefer this for guarding feature routes to avoid flicker during initial navigation.
 * Router will not match the route until the observable resolves.
 */
export const authCanMatch: CanMatchFn = (route, segments: UrlSegment[]) => {
  const router = inject(Router);
  const auth = inject(Auth);
  return authState(auth).pipe(
    take(1),
    map(user => (user ? true : router.createUrlTree(['/login'])))
  );
};

/**
 * Guard for the login route: if user is already logged in, redirect to /discover.
 * Prevents momentary navigation to /login on reload when session is valid.
 */
export const loggedOutOnlyGuard: CanMatchFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);
  return authState(auth).pipe(
    take(1),
    map(user => (user ? router.createUrlTree(['/discover']) : true))
  );
};
