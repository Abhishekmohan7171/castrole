import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { LoadingService } from '../../services/loading.service';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from '@angular/fire/firestore';
import { UserDoc } from '../../../assets/interfaces/interfaces';
import { Profile } from '../../../assets/interfaces/profile.interfaces';
import { filter, take } from 'rxjs';
import {
  SettingsSidebarComponent,
  SettingsTab,
} from './components/settings-sidebar.component';
import { AccountSectionComponent } from './sections/account-section.component';
import { AnalyticsSectionComponent } from './sections/analytics-section.component';
import { PrivacySectionComponent } from './sections/privacy-section.component';
import { SubscriptionsSectionComponent } from './sections/subscriptions-section.component';
import { SupportSectionComponent } from './sections/support-section.component';
import { LegalSectionComponent } from './sections/legal-section.component';
import { AddAccountModalComponent } from './components/add-account-modal.component';

@Component({
  selector: 'app-discover-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SettingsSidebarComponent,
    AccountSectionComponent,
    AnalyticsSectionComponent,
    PrivacySectionComponent,
    SubscriptionsSectionComponent,
    SupportSectionComponent,
    LegalSectionComponent,
    AddAccountModalComponent,
  ],
  templateUrl: './settings.component.html',
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
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
  isProducer = computed(() => this.userRole() === 'producer');
  settingsTheme = computed(() => (this.isActor() ? 'actor-theme' : ''));

  // Subscription status for actors
  isSubscribed = computed(() => {
    if (!this.isActor()) {
      return false;
    }

    const profileData = this.profileService.profileData();
    return profileData?.actorProfile?.isSubscribed ?? false;
  });

  readReceipts = signal<boolean>(true);

  // Active tab signal
  activeTab = signal<SettingsTab>('account');

  // User data signals
  userData = signal<(UserDoc & Profile) | null>(null);
  editableUserData = signal<{ name: string; email: string; phone: string }>({
    name: '',
    email: '',
    phone: '',
  });
  editingFields = signal<Set<string>>(new Set());

  // Analytics mock data
  analyticsData = signal({
    profileOverview: {
      profileViews: 1250,
      wishlistCount: 82,
      avgTimeOnProfile: '3m 12s',
      visibilityScore: 76,
    },
    searchAppearances: {
      count: 186,
      videos: [
        { title: 'Video 1', thumbnail: '' },
        { title: 'Video 2', thumbnail: '' },
      ],
    },
    topPerformingVideo: {
      title: 'Video Title',
      views: '1.3M views',
      avgWatchTime: '3m 20s',
    },
    tagInsights: [
      { tag: 'Comedy', percentage: 85 },
      { tag: 'Drama', percentage: 65 },
    ],
  });

  // Privacy settings signals
  ghostMode = signal<boolean>(false);
  lastSeenVisible = signal<boolean>(true);
  onlineStatusVisible = signal<boolean>(true);
  allowChatRequests = signal<boolean>(true);

  // Modal state signals
  showBlockedUsersModal = signal<boolean>(false);
  showRecentLoginsModal = signal<boolean>(false);
  blockedUsersList = signal<any[]>([]);
  recentLoginsList = signal<any[]>([]);

  private readonly sampleRecentLogins = [
    {
      id: 'session-current',
      platform: 'web',
      model: 'Chrome • macOS',
      city: 'Mumbai, IN',
      lastActive: 'Active now',
      ip: '103.82.115.24',
      browser: 'Chrome 119',
      current: true,
      risk: 'low',
    },
    {
      id: 'session-hyd-1',
      platform: 'ios',
      model: 'iPhone 15 Pro',
      city: 'Hyderabad, IN',
      lastActive: '2 days ago',
      ip: '49.207.11.10',
      browser: 'Castrole iOS',
      risk: 'medium',
    },
    {
      id: 'session-dubai',
      platform: 'web',
      model: 'Edge • Windows',
      city: 'Dubai, UAE',
      lastActive: '3 weeks ago',
      ip: '83.110.44.19',
      browser: 'Edge 118',
      risk: 'high',
    },
  ];

  // Support form signals
  supportSubject = signal<string>('');
  supportConcern = signal<string>('');
  isSubmittingSupport = signal<boolean>(false);

  // Delete account modal signals
  showDeleteAccountModal = signal<boolean>(false);
  deleteConfirmationText = signal<string>('');

  // Add account modal signals
  showAddAccountModal = signal<boolean>(false);
  addAccountType = signal<'actor' | 'producer'>('actor');
  isDeleting = signal<boolean>(false);

  // Mobile sidebar state
  isMobileSidebarOpen = signal(false);

  // Available tabs based on role
  availableTabs = computed(() => {
    const tabs: SettingsTab[] = [
      'account',
      'privacy',
      'subscriptions',
      'support',
      'legal',
    ];
    // Show analytics for all actors (premium content gated inside)
    if (this.isActor()) {
      tabs.splice(3, 0, 'analytics'); // Insert analytics before support for actors
    }
    return tabs;
  });

  // Sidebar classes for mobile/desktop
  sidebarClasses = computed(() => {
    const base =
      'fixed lg:sticky top-0 lg:top-0 left-0 h-screen z-50 transition-transform duration-300';
    const width = 'w-72 lg:w-64';
    const mobile = this.isMobileSidebarOpen()
      ? 'translate-x-0'
      : '-translate-x-full lg:translate-x-0';
    const backdrop = this.isMobileSidebarOpen()
      ? 'lg:bg-transparent bg-black/60 backdrop-blur-sm'
      : '';

    return `${base} ${width} ${mobile} ${backdrop}`;
  });

  async ngOnInit() {
    // Wait for auth to be fully initialized before loading user data
    this.loadingService.isLoading$
      .pipe(
        filter((isLoading) => !isLoading),
        take(1)
      )
      .subscribe(async () => {
        await this.loadUserData();
        await this.profileService.loadProfileData();
      });
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
  }

  // Tab change handler
  onTabChange(tab: SettingsTab): void {
    this.setActiveTab(tab);
    this.isMobileSidebarOpen.set(false);
  }

  // Get tab label for content header
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

  // Get tab icon SVG
  getTabIcon(tab: SettingsTab): string {
    const icons: Record<SettingsTab, string> = {
      account:
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      privacy:
        '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      subscriptions:
        '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
      analytics:
        '<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M2 12h20"/>',
      support:
        '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
      legal:
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>',
    };
    return icons[tab];
  }

  // Get tab description
  getTabDescription(tab: SettingsTab): string {
    const descriptions: Record<SettingsTab, string> = {
      account: 'email, phone number, account type',
      privacy: 'visibility, password, activity status, 2fa, blocked users',
      subscriptions: 'manage subscription, plans, payments, history',
      analytics: 'profile views, reach, media library insights',
      support: 'help, bugs, feedback, contact',
      legal: 'terms & conditions, privacy policy, guidelines, about us',
    };
    return descriptions[tab];
  }

  // Mobile sidebar methods
  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update((v) => !v);
  }

  onSidebarBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.isMobileSidebarOpen.set(false);
    }
  }

  getRiskBadgeClasses(risk?: string): string {
    switch ((risk || 'low').toLowerCase()) {
      case 'high':
        return 'bg-red-500/15 text-red-300 border border-red-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    }
  }

  formatRiskLabel(risk?: string): string {
    switch ((risk || 'low').toLowerCase()) {
      case 'high':
        return 'High risk';
      case 'medium':
        return 'Review';
      default:
        return 'Trusted device';
    }
  }

  getRoleBadgeClasses(role?: string): string {
    switch ((role || 'actor').toLowerCase()) {
      case 'producer':
        return 'bg-amber-500/15 text-amber-200 border border-amber-500/30';
      case 'actor':
        return 'bg-sky-500/15 text-sky-200 border border-sky-500/30';
      default:
        return 'bg-neutral-500/15 text-neutral-200 border border-neutral-500/30';
    }
  }

  formatRoleLabel(role?: string): string {
    if (!role) {
      return 'User';
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  countCurrentSessions(): number {
    const devices = this.recentLoginsList();
    if (!devices?.length) {
      return 0;
    }

    return devices.filter((device) => !!device?.current).length;
  }

  // Navigation methods
  navigateBack() {
    this.router.navigate(['/discover']);
  }

  // Handle data changes from account section
  onEditableDataChange(data: { name: string; email: string; phone: string }) {
    this.editableUserData.set(data);
  }

  private async loadUserData() {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc & Profile;
          this.userData.set(userData);
          this.userRole.set(userData.currentRole || 'actor');
          this.editableUserData.set({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
          });
          // Default to true if not set
          this.readReceipts.set(userData.readReceipts !== false);

          // Load privacy settings
          this.ghostMode.set(userData.ghost || false);
          this.lastSeenVisible.set(userData.lastSeen !== undefined); // If lastSeen exists, it's visible
          this.onlineStatusVisible.set(userData.isOnline !== undefined); // If isOnline exists, it's visible
          this.allowChatRequests.set(userData.allowChatRequests !== false); // Default to true if not set
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Default to actor if there's an error
        this.userRole.set('actor');
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

      // Update userData signal
      const currentUserData = this.userData();
      if (currentUserData) {
        this.userData.set({ ...currentUserData, readReceipts: newValue });
      }

      console.log(`✓ Read receipts ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating read receipts setting:', error);
      // Revert on error
      this.readReceipts.set(!this.readReceipts());
    }
  }

  // Edit field methods
  isEditingField(field: string): boolean {
    return this.editingFields().has(field);
  }

  async toggleEditField(field: 'name' | 'email' | 'phone') {
    const currentlyEditing = this.isEditingField(field);

    if (currentlyEditing) {
      // Save the field
      await this.saveField(field);
    } else {
      // Start editing
      const fields = new Set(this.editingFields());
      fields.add(field);
      this.editingFields.set(fields);
    }
  }

  private async saveField(field: 'name' | 'email' | 'phone') {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const currentData = this.editableUserData();
      const updateData: Partial<UserDoc> = {};

      // Validate the field value
      const fieldValue = currentData[field].trim();
      if (!fieldValue) {
        console.error(`${field} cannot be empty`);
        return;
      }

      // Additional validation for email
      if (field === 'email' && !this.isValidEmail(fieldValue)) {
        console.error('Please enter a valid email address');
        return;
      }

      updateData[field] = fieldValue;

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, updateData);

      // Update the userData signal
      const currentUserData = this.userData();
      if (currentUserData) {
        this.userData.set({ ...currentUserData, [field]: fieldValue });
      }

      // Remove field from editing state
      const fields = new Set(this.editingFields());
      fields.delete(field);
      this.editingFields.set(fields);

      console.log(`✓ ${field} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      // Revert the editable data on error
      const currentUserData = this.userData();
      if (currentUserData) {
        this.editableUserData.set({
          name: currentUserData.name || '',
          email: currentUserData.email || '',
          phone: currentUserData.phone || '',
        });
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Role management methods
  canAddAccount(): boolean {
    const userData = this.userData();
    if (!userData) return false;
    const roles = userData.roles || [];
    return !roles.includes('actor') || !roles.includes('producer');
  }

  getMissingRole(): string {
    const userData = this.userData();
    if (!userData) return '';
    const roles = userData.roles || [];
    if (!roles.includes('actor')) return 'actor';
    if (!roles.includes('producer')) return 'producer';
    return '';
  }

  async addAccount() {
    const missingRole = this.getMissingRole();
    if (!missingRole) return;

    // Set the account type and open the modal
    this.addAccountType.set(missingRole as 'actor' | 'producer');
    this.showAddAccountModal.set(true);
  }

  closeAddAccountModal() {
    this.showAddAccountModal.set(false);
  }

  async handleAddAccountSubmit(formData: {
    name?: string;
    productionHouse?: string;
    location: string;
  }) {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const missingRole = this.getMissingRole();
    if (!missingRole) return;

    try {
      // Call the auth service to add the alternate account
      await this.auth.addAlternateAccount({
        uid: user.uid,
        role: missingRole as 'actor' | 'producer',
        name: formData.name,
        productionHouse: formData.productionHouse,
        location: formData.location,
      });

      // Refresh user data from Firestore
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const updatedUserData = userSnap.data() as UserDoc;
        this.userData.set(updatedUserData);
        this.userRole.set(updatedUserData.currentRole);

        // Reload profile data
        await this.profileService.loadProfileData();
      }

      // Close modal
      this.showAddAccountModal.set(false);

      console.log(`✓ ${missingRole} account added successfully`);
    } catch (error) {
      console.error('Error adding account:', error);
      // Show error to user via modal
      throw error;
    }
  }

  async switchRole() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const currentUserData = this.userData();
    if (!currentUserData) return;

    const roles = currentUserData.roles || [];
    if (roles.length <= 1) {
      console.warn('User only has one role, cannot switch');
      return;
    }

    // Find the other role
    const currentRole = currentUserData.currentRole;
    const otherRole = roles.find((role: string) => role !== currentRole);

    if (!otherRole) {
      console.warn('No other role found to switch to');
      return;
    }

    try {
      // Update the currentRole in Firestore
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        currentRole: otherRole,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      this.userData.set({
        ...currentUserData,
        currentRole: otherRole,
      });
      this.userRole.set(otherRole);

      // Reload profile data for the new role
      await this.profileService.loadProfileData();

      console.log(`✓ Switched to ${otherRole} role successfully`);
    } catch (error) {
      console.error('Error switching role:', error);
    }
  }

  // Privacy settings methods
  async toggleGhostMode() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const newValue = !this.ghostMode();
      this.ghostMode.set(newValue);

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        ghost: newValue,
      });

      // Update userData signal
      const currentUserData = this.userData();
      if (currentUserData) {
        this.userData.set({ ...currentUserData, ghost: newValue });
      }

      console.log(`✓ Ghost mode ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating ghost mode:', error);
      // Revert on error
      this.ghostMode.set(!this.ghostMode());
    }
  }

  async toggleLastSeenVisible() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const newValue = !this.lastSeenVisible();
      this.lastSeenVisible.set(newValue);

      const userDocRef = doc(this.firestore, 'users', user.uid);

      // If disabling, set lastSeen to null, if enabling, set to current timestamp
      const updateData: any = {};
      if (newValue) {
        updateData.lastSeen = new Date(); // Enable by setting current timestamp
      } else {
        updateData.lastSeen = null; // Disable by removing lastSeen
      }

      await updateDoc(userDocRef, updateData);

      // Update userData signal
      const currentUserData = this.userData();
      if (currentUserData) {
        this.userData.set({
          ...currentUserData,
          lastSeen: updateData.lastSeen,
        });
      }

      console.log(
        `✓ Last seen visibility ${newValue ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('Error updating last seen visibility:', error);
      // Revert on error
      this.lastSeenVisible.set(!this.lastSeenVisible());
    }
  }

  async toggleOnlineStatusVisible() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const newValue = !this.onlineStatusVisible();
      this.onlineStatusVisible.set(newValue);

      const userDocRef = doc(this.firestore, 'users', user.uid);

      // If disabling, set isOnline to null, if enabling, set based on current state
      const updateData: any = {};
      if (newValue) {
        updateData.isOnline = true; // Enable by setting current online status
      } else {
        updateData.isOnline = null; // Disable by removing online status
      }

      await updateDoc(userDocRef, updateData);

      // Update userData signal
      const currentUserData = this.userData();
      if (currentUserData) {
        this.userData.set({
          ...currentUserData,
          isOnline: updateData.isOnline,
        });
      }

      console.log(
        `✓ Online status visibility ${newValue ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('Error updating online status visibility:', error);
      // Revert on error
      this.onlineStatusVisible.set(!this.onlineStatusVisible());
    }
  }

  async toggleAllowChatRequests() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const newValue = !this.allowChatRequests();
      this.allowChatRequests.set(newValue);

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        allowChatRequests: newValue,
      });

      // Update userData signal
      const currentUserData = this.userData();
      if (currentUserData) {
        this.userData.set({ ...currentUserData, allowChatRequests: newValue });
      }

      console.log(`✓ Chat requests ${newValue ? 'allowed' : 'blocked'}`);
    } catch (error) {
      console.error('Error updating chat request settings:', error);
      // Revert on error
      this.allowChatRequests.set(!this.allowChatRequests());
    }
  }

  // Account management methods
  viewBlockedUsers() {
    const blockedUsers = this.userData()?.blocked || [];
    this.blockedUsersList.set(blockedUsers);
    this.showBlockedUsersModal.set(true);
  }

  viewRecentLogins() {
    const devices = this.userData()?.device || [];
    this.recentLoginsList.set(
      devices.length ? devices : this.sampleRecentLogins
    );
    this.showRecentLoginsModal.set(true);
  }

  // Modal management methods
  closeBlockedUsersModal() {
    this.showBlockedUsersModal.set(false);
  }

  closeRecentLoginsModal() {
    this.showRecentLoginsModal.set(false);
  }

  async logoutAllDevices() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      // Clear all device tokens and update login time
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        device: [], // Clear all devices
        loggedInTime: serverTimestamp(), // Update login time to invalidate other sessions
        isOnline: false,
        lastSeen: serverTimestamp(),
      });

      console.log('✓ Logged out from all devices');

      // Close the modal
      this.closeRecentLoginsModal();

      // Sign out the current user and redirect to login
      await this.auth.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error logging out from all devices:', error);
      alert('Failed to logout from all devices. Please try again.');
    }
  }

  deleteAccount() {
    this.showDeleteAccountModal.set(true);
    this.deleteConfirmationText.set('');
  }

  closeDeleteAccountModal() {
    this.showDeleteAccountModal.set(false);
    this.deleteConfirmationText.set('');
    this.isDeleting.set(false);
  }

  getRequiredDeleteText(): string {
    const userData = this.userData();
    return userData?.name ? `delete ${userData.name}` : 'delete account';
  }

  canConfirmDelete(): boolean {
    const requiredText = this.getRequiredDeleteText();
    return (
      this.deleteConfirmationText().toLowerCase() === requiredText.toLowerCase()
    );
  }

  async confirmDeleteAccount() {
    if (!this.canConfirmDelete()) {
      return;
    }

    this.isDeleting.set(true);

    try {
      // TODO: Replace with actual Firebase deletion logic
      console.log(
        '🗑️ Account deletion confirmed for user:',
        this.userData()?.name
      );
      console.log(
        '🗑️ This would delete all user data, profile, media, and chat history'
      );

      // Simulate deletion process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('✅ Account deletion completed (simulated)');

      // In real implementation, this would:
      // 1. Delete user document from Firestore
      // 2. Delete all user media from Storage
      // 3. Remove user from all chat rooms
      // 4. Delete user authentication
      // 5. Sign out and redirect to login

      this.closeDeleteAccountModal();
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      this.isDeleting.set(false);
    }
  }

  // Helper methods for blocked users modal
  getBlockedUserInitial(blockedUser: any): string {
    const source = blockedUser.displayName || blockedUser.blockedBy || 'user';
    return source?.[0]?.toUpperCase() || 'U';
  }

  getBlockedUserName(blockedUser: any): string {
    return blockedUser.displayName || blockedUser.blockedBy || 'Unknown User';
  }

  formatBlockedDate(date: any): string {
    if (!date) return 'Unknown';

    try {
      const blockedDate = date.toDate ? date.toDate() : new Date(date);
      const now = new Date();
      const diffTime = now.getTime() - blockedDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'today';
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return 'Unknown';
    }
  }

  async unblockUser(blockedUser: any) {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const currentUserData = this.userData();
      if (!currentUserData) return;

      // Remove the blocked user from the blocked list
      const updatedBlocked = (currentUserData.blocked || []).filter(
        (blocked: any) => blocked.blockedBy !== blockedUser.blockedBy
      );

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        blocked: updatedBlocked,
      });

      // Update local state
      this.userData.set({
        ...currentUserData,
        blocked: updatedBlocked,
      });

      // Update modal list
      this.blockedUsersList.set(updatedBlocked);

      console.log(`✓ Unblocked user: ${blockedUser.blockedBy}`);
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  }

  // Helper methods for recent logins modal
  getDeviceIcon(platform: string): string {
    switch (platform?.toLowerCase()) {
      case 'web':
      case 'browser':
        return '🌐';
      case 'ios':
      case 'iphone':
      case 'ipad':
        return '📱';
      case 'android':
        return '📱';
      case 'desktop':
      case 'electron':
        return '💻';
      default:
        return '📱';
    }
  }

  getDeviceDisplayName(device: any): string {
    if (device.model) {
      return device.model;
    }

    switch (device.platform?.toLowerCase()) {
      case 'web':
      case 'browser':
        return 'Web Browser';
      case 'ios':
        return 'iPhone/iPad';
      case 'android':
        return 'Android Device';
      case 'desktop':
        return 'Desktop App';
      default:
        return 'Unknown Device';
    }
  }

  // Subscription management methods
  upgradeSubscription() {
    // TODO: Implement subscription upgrade flow
    // This would involve:
    // 1. Redirecting to payment gateway
    // 2. Processing payment
    // 3. Updating user subscription status
    console.log('✓ Upgrade subscription initiated');
    // For now, just show success message
  }

  manageSubscription() {
    // TODO: Implement subscription management
    // This could show a modal or redirect to billing portal
    // Features to include:
    // - Change payment method
    // - Update billing address
    // - Cancel subscription
    // - Download invoices
    console.log('✓ Manage subscription opened');
  }

  viewPaymentHistory() {
    // TODO: Implement payment history view
    // This could show a modal with:
    // - List of past payments
    // - Invoice downloads
    // - Receipt downloads
    // - Payment method used
    // - Status of each payment
    console.log('✓ Payment history opened');
  }

  // Support form methods
  async submitSupportForm() {
    if (!this.supportSubject().trim() || !this.supportConcern().trim()) {
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user) return;

    this.isSubmittingSupport.set(true);

    try {
      const userData = this.userData();
      const supportTicket = {
        userId: user.uid,
        userEmail: userData?.email || user.email || '',
        userName: userData?.name || '',
        subject: this.supportSubject().trim(),
        concern: this.supportConcern().trim(),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const supportCollection = collection(this.firestore, 'support_tickets');
      await addDoc(supportCollection, supportTicket);

      console.log('✓ Support form submitted successfully');

      // Reset form and show success state
      this.supportSubject.set('');
      this.supportConcern.set('');
      this.isSubmittingSupport.set(false);

      alert("Thank you for your feedback! We'll get back to you soon.");
    } catch (error) {
      console.error('Error submitting support form:', error);
      this.isSubmittingSupport.set(false);
      alert('Failed to submit your feedback. Please try again.');
    }
  }
}
