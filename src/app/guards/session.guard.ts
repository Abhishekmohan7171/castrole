import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { SessionValidationService } from '../services/session-validation.service';

/**
 * Session Guard
 * Validates that the current session is still valid before allowing route activation
 * Runs on every navigation to protected routes
 */
export const sessionGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const sessionValidation = inject(SessionValidationService);
  const router = inject(Router);

  const user = auth.currentUser;

  // If no user is authenticated, let authGuard handle it
  if (!user) {
    return true;
  }

  // Validate the session
  const isValid = await sessionValidation.validateSession(user.uid);

  if (!isValid) {
    console.log('[SessionGuard] Session is invalid, triggering auto-logout');

    // Session has been invalidated, trigger auto-logout
    await sessionValidation.autoLogout();

    // Redirect to login with session-expired reason
    return router.createUrlTree(['/auth/login'], {
      queryParams: { reason: 'session-expired' }
    });
  }

  // Session is valid, allow navigation
  return true;
};
