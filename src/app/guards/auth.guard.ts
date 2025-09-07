import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard: allows navigation only if a user is logged in.
 * Otherwise, redirects to /login.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const user = authService.getCurrentUser();
  if (user) return true;

  // Not logged in -> redirect to /login
  return router.createUrlTree(['/login']);
};
