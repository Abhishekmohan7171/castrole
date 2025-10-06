import { Component, OnInit, ApplicationRef, NgZone } from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { LoadingService } from './services/loading.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'castrole';
  private auth = inject(Auth);
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private appRef = inject(ApplicationRef);
  private ngZone = inject(NgZone);
  
  isLoading$ = this.loadingService.isLoading$;
  authInitialized = false;
  
  ngOnInit() {
    // Wait for Firebase Auth to initialize
    const unsubscribe = this.auth.onAuthStateChanged((user) => {
      // Run in NgZone to ensure Angular detects the changes
      this.ngZone.run(() => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        
        // Mark auth as initialized
        this.authInitialized = true;
        
        // Auth state has been determined, we can stop showing the loading screen
        this.loadingService.setLoading(false);
        
        // Get the current URL from the window location (more reliable before navigation starts)
        const currentPath = window.location.pathname;
        
        // Now we can safely navigate based on auth state
        this.router.initialNavigation();
        
        // Only redirect if we're on the default route (/) or no specific route
        // Don't redirect if user is on specific pages like reset-password, login, or onboarding
        const protectedPaths = ['/reset-password', '/login', '/onboarding'];
        const shouldRedirect = currentPath === '/' || currentPath === '' || 
                              !protectedPaths.some(path => currentPath.startsWith(path));
        
        if (shouldRedirect) {
          // Navigate to the appropriate route based on auth state
          if (user) {
            // User is logged in, navigate to discover
            this.router.navigateByUrl('/discover');
          } else {
            // User is not logged in, navigate to login
            this.router.navigateByUrl('/login');
          }
        }
        // Otherwise, let the route guards handle the navigation
        
        // Unsubscribe from auth state changes
        unsubscribe();
      });
    });
  }
}
