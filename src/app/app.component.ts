import { Component, OnInit, ApplicationRef, NgZone } from '@angular/core';
import { RouterOutlet, Router, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { LoadingService } from './services/loading.service';
import { LoaderComponent } from './common-components/loader/loader.component';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LoaderComponent],
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
        
        // Now we can safely navigate based on auth state
        this.router.initialNavigation();
        
        // Navigate to the appropriate route based on auth state
        if (user) {
          // User is logged in, navigate to discover
          this.router.navigateByUrl('/discover');
        } else {
          // User is not logged in, navigate to login
          this.router.navigateByUrl('/login');
        }
        
        // Unsubscribe from auth state changes
        unsubscribe();
      });
    });
  }
}
