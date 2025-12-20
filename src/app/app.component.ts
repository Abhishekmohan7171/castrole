import { Component, OnInit, NgZone, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { LoadingService } from './services/loading.service';
import { SessionValidationService } from './services/session-validation.service';
import { ToastComponent } from './common-components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'castrole';
  private auth = inject(Auth);
  private loadingService = inject(LoadingService);
  private sessionValidation = inject(SessionValidationService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  isLoading$ = this.loadingService.isLoading$;
  authInitialized = false;
  
  ngOnInit() {
    // Wait for Firebase Auth to initialize
    const unsubscribe = this.auth.onAuthStateChanged(async (user) => {
      // Run in NgZone to ensure Angular detects the changes
      await this.ngZone.run(async () => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');

        // Mark auth as initialized
        this.authInitialized = true;

        // Auth state has been determined, we can stop showing the loading screen
        this.loadingService.setLoading(false);

        // Get the current URL (SSR-safe)
        const currentPath = isPlatformBrowser(this.platformId)
          ? window.location.pathname
          : this.router.url || '/';

        // Now we can safely navigate based on auth state
        this.router.initialNavigation();

        // Define paths that should not be accessed when logged in
        const authOnlyPaths = ['/login', '/reset-password'];
        // Define paths that require authentication
        const protectedPaths = ['/discover'];

        // Check if we need to redirect
        if (user) {
          // User is logged in - validate and initialize session
          const isValid = await this.sessionValidation.validateSession(user.uid);

          if (!isValid) {
            // Session was invalidated while offline, auto-logout
            console.log('[AppComponent] Session invalidated, logging out');
            await this.sessionValidation.autoLogout();
            return;
          }

          // Session is valid, initialize session listener
          this.sessionValidation.initializeSession(user.uid);

          if (authOnlyPaths.some(path => currentPath.startsWith(path))) {
            // Redirect away from auth-only pages to discover
            this.router.navigateByUrl('/discover');
          } else if (currentPath === '/' || currentPath === '') {
            // Only redirect from root to discover
            this.router.navigateByUrl('/discover');
          }
          // Otherwise preserve the current route (e.g., /discover/chat)
        } else {
          // User is not logged in
          if (protectedPaths.some(path => currentPath.startsWith(path))) {
            // Redirect away from protected pages to login
            this.router.navigateByUrl('/login');
          } else if (currentPath === '/' || currentPath === '') {
            // Redirect from root to login
            this.router.navigateByUrl('/login');
          }
          // Otherwise preserve the current route (e.g., /onboarding)
        }

        // Unsubscribe from auth state changes
        unsubscribe();
      });
    });
  }
}
