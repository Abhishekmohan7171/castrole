import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../../assets/interfaces/interfaces';
import { AccountSectionComponent } from './sections/account-section.component';
import { PrivacySectionComponent } from './sections/privacy-section.component';
import { SubscriptionsSectionComponent } from './sections/subscriptions-section.component';
import { AnalyticsSectionComponent } from './sections/analytics-section.component';
import { SupportSectionComponent } from './sections/support-section.component';
import { LegalSectionComponent } from './sections/legal-section.component';

type SettingsTab =
  | 'account'
  | 'privacy'
  | 'subscriptions'
  | 'analytics'
  | 'support'
  | 'legal';

@Component({
  selector: 'app-discover-settings',
  standalone: true,
  imports: [
    CommonModule,
    AccountSectionComponent,
    PrivacySectionComponent,
    SubscriptionsSectionComponent,
    AnalyticsSectionComponent,
    SupportSectionComponent,
    LegalSectionComponent,
  ],
  template: `
    <div class="min-h-screen bg-neutral-950">
      <!-- Mobile Header -->
      <div class="lg:hidden sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div class="flex items-center justify-between px-4 py-3">
          <button
            (click)="toggleMobileSidebar()"
            class="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-white">Settings</h1>
          <div class="w-10"></div>
        </div>
      </div>

      <div class="flex">
        <!-- Sidebar Navigation -->
        <aside
          [class]="sidebarClasses()"
          (click)="onSidebarBackdropClick($event)"
        >
          <div
            class="bg-neutral-900 h-full overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <!-- Desktop Header -->
            <div class="hidden lg:block px-6 py-6 border-b border-neutral-800">
              <h1 class="text-xl font-semibold text-white">settings</h1>
            </div>

            <!-- Navigation Items -->
            <nav class="space-y-1 p-4">
              <button
                (click)="navigateToTab('account')"
                [class]="activeTab() === 'account' 
                  ? 'w-full text-left px-4 py-3 rounded-lg bg-purple-600/20 border-l-2 border-purple-500 transition-all duration-200'
                  : 'w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 border-l-2 border-transparent transition-all duration-200'"
              >
                <div class="flex items-start gap-3">
                  <div [class]="activeTab() === 'account' ? 'text-purple-400 mt-0.5' : 'text-neutral-500 mt-0.5'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="flex-1 space-y-0.5">
                    <h3 [class]="activeTab() === 'account' ? 'text-base font-medium text-white' : 'text-base font-medium text-neutral-300'">
                      account
                    </h3>
                    <p class="text-xs text-neutral-500 leading-tight">
                      email, phone number, account type
                    </p>
                  </div>
                </div>
              </button>

              <button
                (click)="navigateToTab('privacy')"
                [class]="activeTab() === 'privacy' 
                  ? 'w-full text-left px-4 py-3 rounded-lg bg-purple-600/20 border-l-2 border-purple-500 transition-all duration-200'
                  : 'w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 border-l-2 border-transparent transition-all duration-200'"
              >
                <div class="flex items-start gap-3">
                  <div [class]="activeTab() === 'privacy' ? 'text-purple-400 mt-0.5' : 'text-neutral-500 mt-0.5'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div class="flex-1 space-y-0.5">
                    <h3 [class]="activeTab() === 'privacy' ? 'text-base font-medium text-white' : 'text-base font-medium text-neutral-300'">
                      privacy & security
                    </h3>
                    <p class="text-xs text-neutral-500 leading-tight">
                      visibility, password, activity status, 2fa, blocked users
                    </p>
                  </div>
                </div>
              </button>

              <button
                (click)="navigateToTab('subscriptions')"
                [class]="activeTab() === 'subscriptions' 
                  ? 'w-full text-left px-4 py-3 rounded-lg bg-purple-600/20 border-l-2 border-purple-500 transition-all duration-200'
                  : 'w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 border-l-2 border-transparent transition-all duration-200'"
              >
                <div class="flex items-start gap-3">
                  <div [class]="activeTab() === 'subscriptions' ? 'text-purple-400 mt-0.5' : 'text-neutral-500 mt-0.5'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div class="flex-1 space-y-0.5">
                    <h3 [class]="activeTab() === 'subscriptions' ? 'text-base font-medium text-white' : 'text-base font-medium text-neutral-300'">
                      subscriptions
                    </h3>
                    <p class="text-xs text-neutral-500 leading-tight">
                      manage subscription, plans, payments, history
                    </p>
                  </div>
                </div>
              </button>

              <button
                (click)="navigateToTab('analytics')"
                [class]="activeTab() === 'analytics' 
                  ? 'w-full text-left px-4 py-3 rounded-lg bg-purple-600/20 border-l-2 border-purple-500 transition-all duration-200'
                  : 'w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 border-l-2 border-transparent transition-all duration-200'"
              >
                <div class="flex items-start gap-3">
                  <div [class]="activeTab() === 'analytics' ? 'text-purple-400 mt-0.5' : 'text-neutral-500 mt-0.5'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div class="flex-1 space-y-0.5">
                    <h3 [class]="activeTab() === 'analytics' ? 'text-base font-medium text-white' : 'text-base font-medium text-neutral-300'">
                      analytics
                    </h3>
                    <p class="text-xs text-neutral-500 leading-tight">
                      profile views, reach, media library insights
                    </p>
                  </div>
                </div>
              </button>

              <button
                (click)="navigateToTab('support')"
                [class]="activeTab() === 'support' 
                  ? 'w-full text-left px-4 py-3 rounded-lg bg-purple-600/20 border-l-2 border-purple-500 transition-all duration-200'
                  : 'w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 border-l-2 border-transparent transition-all duration-200'"
              >
                <div class="flex items-start gap-3">
                  <div [class]="activeTab() === 'support' ? 'text-purple-400 mt-0.5' : 'text-neutral-500 mt-0.5'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div class="flex-1 space-y-0.5">
                    <h3 [class]="activeTab() === 'support' ? 'text-base font-medium text-white' : 'text-base font-medium text-neutral-300'">
                      support & feedback
                    </h3>
                    <p class="text-xs text-neutral-500 leading-tight">
                      help, bugs, feedback, contact
                    </p>
                  </div>
                </div>
              </button>

              <button
                (click)="navigateToTab('legal')"
                [class]="activeTab() === 'legal' 
                  ? 'w-full text-left px-4 py-3 rounded-lg bg-purple-600/20 border-l-2 border-purple-500 transition-all duration-200'
                  : 'w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 border-l-2 border-transparent transition-all duration-200'"
              >
                <div class="flex items-start gap-3">
                  <div [class]="activeTab() === 'legal' ? 'text-purple-400 mt-0.5' : 'text-neutral-500 mt-0.5'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div class="flex-1 space-y-0.5">
                    <h3 [class]="activeTab() === 'legal' ? 'text-base font-medium text-white' : 'text-base font-medium text-neutral-300'">
                      legal
                    </h3>
                    <p class="text-xs text-neutral-500 leading-tight">
                      terms & conditions, privacy policy, guidelines, about us
                    </p>
                  </div>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-h-screen">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            @switch (activeTab()) {
              @case ('account') {
                <app-account-section />
              }
              @case ('privacy') {
                <app-privacy-section />
              }
              @case ('subscriptions') {
                <app-subscriptions-section />
              }
              @case ('analytics') {
                <app-analytics-section />
              }
              @case ('support') {
                <app-support-section />
              }
              @case ('legal') {
                <app-legal-section />
              }
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private firestore = inject(Firestore);

  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');

  // Active tab signal
  activeTab = signal<SettingsTab>('account');
  isMobileSidebarOpen = signal(false);

  // Computed
  sidebarClasses = computed(() => {
    const base = 'fixed lg:sticky top-0 lg:top-0 left-0 h-screen z-50 transition-transform duration-300';
    const width = 'w-72 lg:w-64';
    const mobile = this.isMobileSidebarOpen() 
      ? 'translate-x-0' 
      : '-translate-x-full lg:translate-x-0';
    const backdrop = this.isMobileSidebarOpen() 
      ? 'lg:bg-transparent bg-black/60 backdrop-blur-sm' 
      : '';
    
    return `${base} ${width} ${mobile} ${backdrop}`;
  });

  // Available tabs based on role
  availableTabs = computed(() => {
    const tabs: SettingsTab[] = [
      'account',
      'privacy',
      'subscriptions',
      'support',
      'legal',
    ];
    if (this.isActor()) {
      tabs.splice(3, 0, 'analytics'); // Insert analytics before support for actors
    }
    return tabs;
  });

  ngOnInit() {
    this.loadUserRole();
  }

  navigateToTab(tab: SettingsTab) {
    this.activeTab.set(tab);
    this.isMobileSidebarOpen.set(false);
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.set(!this.isMobileSidebarOpen());
  }

  onSidebarBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.isMobileSidebarOpen.set(false);
    }
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
  }

  getTabLabel(tab: SettingsTab): string {
    const labels: Record<SettingsTab, string> = {
      account: 'account',
      privacy: 'privacy & security',
      subscriptions: 'subscriptions',
      analytics: 'analytics',
      support: 'support & feedback',
      legal: 'legal',
    };
    return labels[tab];
  }

  private async loadUserRole() {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          this.userRole.set(userData.currentRole || 'actor');
        }
      } catch (error) {
        // Default to actor if there's an error
        this.userRole.set('actor');
      }
    }
  }

}
