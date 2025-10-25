import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';

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
  imports: [CommonModule],
  template: `
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6"
      [ngClass]="settingsTheme()"
    >
      <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <!-- Left: Sidebar -->
        <aside
          class="rounded-2xl p-4 transition-all duration-300"
          [ngClass]="{
            'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10':
              isActor(),
            'bg-black/40 ring-2 ring-white/10 border border-neutral-800':
              !isActor()
          }"
        >
          <h2
            class="text-sm font-semibold mb-3"
            [ngClass]="{
              'text-purple-200/70': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            settings
          </h2>
          <nav class="space-y-1 text-sm">
            <button
              (click)="setActiveTab('account')"
              class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
              [ngClass]="{
                'ring-purple-900/15 bg-purple-900/20 text-purple-100/80':
                  isActor() && activeTab() === 'account',
                'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10':
                  isActor() && activeTab() !== 'account',
                'ring-white/10 bg-white/5 text-neutral-200':
                  !isActor() && activeTab() === 'account',
                'ring-white/10 text-neutral-300 hover:bg-white/5':
                  !isActor() && activeTab() !== 'account'
              }"
            >
              account
              <div
                class="text-[11px]"
                [ngClass]="{
                  'text-purple-200/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                username, phone number, email, account type
              </div>
            </button>
            <button
              (click)="setActiveTab('privacy')"
              class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
              [ngClass]="{
                'ring-purple-900/15 bg-purple-900/20 text-purple-100/80':
                  isActor() && activeTab() === 'privacy',
                'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10':
                  isActor() && activeTab() !== 'privacy',
                'ring-white/10 bg-white/5 text-neutral-200':
                  !isActor() && activeTab() === 'privacy',
                'ring-white/10 text-neutral-300 hover:bg-white/5':
                  !isActor() && activeTab() !== 'privacy'
              }"
            >
              privacy & security
              <div
                class="text-[11px]"
                [ngClass]="{
                  'text-purple-200/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                visibility, password, activity status, blocked users
              </div>
            </button>
            <button
              (click)="setActiveTab('subscriptions')"
              class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
              [ngClass]="{
                'ring-purple-900/15 bg-purple-900/20 text-purple-100/80':
                  isActor() && activeTab() === 'subscriptions',
                'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10':
                  isActor() && activeTab() !== 'subscriptions',
                'ring-white/10 bg-white/5 text-neutral-200':
                  !isActor() && activeTab() === 'subscriptions',
                'ring-white/10 text-neutral-300 hover:bg-white/5':
                  !isActor() && activeTab() !== 'subscriptions'
              }"
            >
              subscriptions
              <div
                class="text-[11px]"
                [ngClass]="{
                  'text-purple-200/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                manage subscription, plans, payments, history
              </div>
            </button>
            @if (isActor()) {
            <button
              (click)="setActiveTab('analytics')"
              class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
              [ngClass]="{
                'ring-purple-900/15 bg-purple-900/20 text-purple-100/80':
                  activeTab() === 'analytics',
                'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10':
                  activeTab() !== 'analytics'
              }"
            >
              analytics
              <div class="text-[11px] text-purple-200/50">
                profile views, reach, media library insights
              </div>
            </button>
            }
            <button
              (click)="setActiveTab('support')"
              class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
              [ngClass]="{
                'ring-purple-900/15 bg-purple-900/20 text-purple-100/80':
                  isActor() && activeTab() === 'support',
                'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10':
                  isActor() && activeTab() !== 'support',
                'ring-white/10 bg-white/5 text-neutral-200':
                  !isActor() && activeTab() === 'support',
                'ring-white/10 text-neutral-300 hover:bg-white/5':
                  !isActor() && activeTab() !== 'support'
              }"
            >
              support & feedback
              <div
                class="text-[11px]"
                [ngClass]="{
                  'text-purple-200/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                help, bugs, feedback, contact
              </div>
            </button>
            <button
              (click)="setActiveTab('legal')"
              class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
              [ngClass]="{
                'ring-purple-900/15 bg-purple-900/20 text-purple-100/80':
                  isActor() && activeTab() === 'legal',
                'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10':
                  isActor() && activeTab() !== 'legal',
                'ring-white/10 bg-white/5 text-neutral-200':
                  !isActor() && activeTab() === 'legal',
                'ring-white/10 text-neutral-300 hover:bg-white/5':
                  !isActor() && activeTab() !== 'legal'
              }"
            >
              legal
              <div
                class="text-[11px]"
                [ngClass]="{
                  'text-purple-200/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                terms & conditions, privacy policy, guidelines
              </div>
            </button>
          </nav>
        </aside>

        <!-- Right: Content panel -->
        <section
          class="rounded-2xl p-6 transition-all duration-300"
          [ngClass]="{
            'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10':
              isActor(),
            'bg-black/40 ring-2 ring-white/10 border border-neutral-800':
              !isActor()
          }"
        >
          <h2
            class="text-sm font-semibold mb-6"
            [ngClass]="{
              'text-purple-200/70': isActor(),
              'text-neutral-300': !isActor()
            }"
          >
            {{ getTabLabel(activeTab()) }}
          </h2>

          @switch (activeTab()) { @case ('account') {
          <div class="space-y-6">
            <div
              class="text-xs font-medium uppercase tracking-wide mb-3"
              [ngClass]="{
                'text-purple-300/50': isActor(),
                'text-neutral-500': !isActor()
              }"
            >
              Basic Information
            </div>
            <div class="space-y-3">
              <div
                class="text-xs"
                [ngClass]="{
                  'text-purple-200/60': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                @if (isActor()) { Profile, Notifications, Linked Accounts,
                Deactivate Account } @else { Mobile Number Edit, Username Edit,
                Email Edit, Add Actor Account }
              </div>
            </div>
          </div>
          } @case ('privacy') {
          <div class="space-y-6">
            <div
              class="text-xs font-medium uppercase tracking-wide mb-3"
              [ngClass]="{
                'text-purple-300/50': isActor(),
                'text-neutral-500': !isActor()
              }"
            >
              Privacy & Security Settings
            </div>
            <div class="space-y-3">
              <div
                class="text-xs"
                [ngClass]="{
                  'text-purple-200/60': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                @if (isActor()) { Visibility & Search, Account Management, Data
                & Privacy } @else { Profile Visibility, Change Password, Chat
                Settings, Account Management }
              </div>
            </div>
          </div>
          } @case ('subscriptions') {
          <div class="space-y-6">
            <div
              class="text-xs font-medium uppercase tracking-wide mb-3"
              [ngClass]="{
                'text-purple-300/50': isActor(),
                'text-neutral-500': !isActor()
              }"
            >
              Subscription Management
            </div>
            <div class="space-y-3">
              <div
                class="text-xs"
                [ngClass]="{
                  'text-purple-200/60': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                @if (isActor()) { Current Plan, Billing, Payment Methods } @else
                { Promo Codes, Manage Plan, History of Payments, Billing Address
                }
              </div>
            </div>
          </div>
          } @case ('analytics') {
          <div class="space-y-6">
            <div
              class="text-xs font-medium uppercase tracking-wide mb-3 text-purple-300/50"
            >
              Analytics & Insights
            </div>
            <div class="space-y-3">
              <div class="text-xs text-purple-200/60">
                Profile Views, Search Appearances, Portfolio Views, Video Views,
                Business Card Scans
              </div>
            </div>
          </div>
          } @case ('support') {
          <div class="space-y-6">
            <div
              class="text-xs font-medium uppercase tracking-wide mb-3"
              [ngClass]="{
                'text-purple-300/50': isActor(),
                'text-neutral-500': !isActor()
              }"
            >
              Support & Feedback
            </div>
            <div class="space-y-3">
              <div
                class="text-xs"
                [ngClass]="{
                  'text-purple-200/60': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                @if (isActor()) { Contact Us (Suggestions, Reporting, Contact),
                Documentation Access } @else { Report Bug, Support, Suggestions
                }
              </div>
            </div>
          </div>
          } @case ('legal') {
          <div class="space-y-6">
            <div
              class="text-xs font-medium uppercase tracking-wide mb-3"
              [ngClass]="{
                'text-purple-300/50': isActor(),
                'text-neutral-500': !isActor()
              }"
            >
              Legal Documents
            </div>
            <div class="space-y-3">
              <div
                class="text-xs"
                [ngClass]="{
                  'text-purple-200/60': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                @if (isActor()) { Terms of Service, Privacy Policy, Community
                Guidelines, Cookie Policy } @else { Community Guidelines,
                Privacy Policy, Terms & Conditions, Licenses and Open Software }
              </div>
            </div>
          </div>
          } }
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      /* Subtle purple gradient background for actors */
      .actor-theme::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(
            ellipse at top left,
            rgba(147, 51, 234, 0.03) 0%,
            transparent 40%
          ),
          radial-gradient(
            ellipse at bottom right,
            rgba(168, 85, 247, 0.02) 0%,
            transparent 40%
          );
        pointer-events: none;
        z-index: 0;
      }
      .actor-theme {
        position: relative;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private firestore = inject(Firestore);

  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
  settingsTheme = computed(() => (this.isActor() ? 'actor-theme' : ''));

  readReceipts = signal<boolean>(true);

  // Active tab signal
  activeTab = signal<SettingsTab>('account');

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

  private async loadPrivacySettings() {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          // Default to true if not set
          this.readReceipts.set(userData.readReceipts !== false);
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      }
    }
  }

  async toggleReadReceipts() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const newValue = !this.readReceipts();
      this.readReceipts.set(newValue);

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        readReceipts: newValue,
      });

      console.log(`✓ Read receipts ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating read receipts setting:', error);
      // Revert on error
      this.readReceipts.set(!this.readReceipts());
    }
  }
}
