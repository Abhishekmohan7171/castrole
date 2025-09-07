import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClickOutsideDirective } from '../common-components/directives/click-outside.directive';
import { LoaderComponent } from '../common-components/loader/loader.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ClickOutsideDirective, LoaderComponent],
  template: `
    <div class="min-h-screen bg-black text-neutral-200">
      <!-- Loader -->
      <app-loader [show]="isLoggingOut" message="Logging out..."></app-loader>
      <!-- Top bar -->
      <header class="sticky top-0 z-40 bg-black/70 backdrop-blur">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <a routerLink="/" class="text-3xl font-black tracking-wider text-neutral-300 select-none">castrole</a>
          <nav class="flex items-center gap-8 text-sm">
            <a routerLink="/discover" routerLinkActive="text-fuchsia-300" [routerLinkActiveOptions]="{ exact: true }" class="text-neutral-500 hover:text-neutral-300 transition">discover</a>
            <a routerLink="/discover/upload" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition">upload</a>
            <a routerLink="/discover/chat" routerLinkActive="text-fuchsia-300" class="text-neutral-500 hover:text-neutral-300 transition">chat</a>

            <!-- User profile dropdown -->
            <div class="relative" clickOutside (clickOutside)="closeDropdown()">
              <button
                (click)="toggleDropdown()"
                class="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition focus:outline-none"
                [class.text-fuchsia-300]="isProfileActive">
                <span>{{ userName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div *ngIf="showDropdown" class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-neutral-800 ring-1 ring-black ring-opacity-5 py-1 z-50">
                <a routerLink="/discover/profile" routerLinkActive="bg-neutral-700" class="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition">Profile</a>
                <button (click)="logout()" class="w-full text-left block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition">Logout</button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <!-- Child content -->
      <main class="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <router-outlet />
      </main>
    </div>
  `,
  styles: []
})
export class DiscoverComponent implements OnInit {
  userName: string = 'User';
  showDropdown: boolean = false;
  isProfileActive: boolean = false;
  isLoggingOut: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Get current user and set username
    const user = this.authService.getCurrentUser();
    if (user && user.displayName) {
      this.userName = user.displayName;
    }

    // Check if profile route is active
    this.isProfileActive = this.router.url.includes('/discover/profile');
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  logout(): void {
    this.isLoggingOut = true;
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error('Logout error:', error);
    }).finally(() => {
      this.isLoggingOut = false;
    });
  }
}
