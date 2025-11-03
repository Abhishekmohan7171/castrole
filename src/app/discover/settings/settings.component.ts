import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../../assets/interfaces/interfaces';
import { Profile } from '../../../assets/interfaces/profile.interfaces';
import { SettingsSidebarComponent, SettingsTab } from './components/settings-sidebar.component';

@Component({
  selector: 'app-discover-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SettingsSidebarComponent],
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

  // Support form signals
  supportSubject = signal<string>('');
  supportConcern = signal<string>('');
  isSubmittingSupport = signal<boolean>(false);

  // Legal section signals
  legalActiveView = signal<
    'menu' | 'terms' | 'privacy' | 'guidelines' | 'about'
  >('menu');

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

  async ngOnInit() {
    await this.loadUserData();
    await this.profileService.loadProfileData();
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
    // Reset legal view to menu when switching to legal tab
    if (tab === 'legal') {
      this.legalActiveView.set('menu');
    }
  }

  // Tab change handler
  onTabChange(tab: SettingsTab): void {
    this.setActiveTab(tab);
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
          this.allowChatRequests.set(true); // Default to true, could be extended based on role settings
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
    const roles = this.userData()?.roles || [];
    return !roles.includes('actor') || !roles.includes('producer');
  }

  getMissingRole(): string {
    const roles = this.userData()?.roles || [];
    if (!roles.includes('actor')) return 'actor';
    if (!roles.includes('producer')) return 'producer';
    return '';
  }

  async addAccount() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const missingRole = this.getMissingRole();
    if (!missingRole) return;

    try {
      const currentUserData = this.userData();
      if (!currentUserData) return;

      const updatedRoles = [...currentUserData.roles];
      if (!updatedRoles.includes(missingRole)) {
        updatedRoles.push(missingRole);
      }

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        roles: updatedRoles,
        currentRole: missingRole, // Switch to the newly added role
      });

      // Update local state
      this.userData.set({
        ...currentUserData,
        roles: updatedRoles,
        currentRole: missingRole,
      });
      this.userRole.set(missingRole);

      console.log(`✓ ${missingRole} account added successfully`);
    } catch (error) {
      console.error('Error adding account:', error);
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

      // This could be extended to update user settings for chat request permissions
      // For now, it's just a UI toggle
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
    this.recentLoginsList.set(devices);
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
      // TODO: Implement logout from all devices
      // This would involve:
      // 1. Clearing all device tokens
      // 2. Updating the user document to remove device info
      // 3. Forcing re-authentication on other devices

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        device: [], // Clear all devices
        loggedInTime: new Date(), // Update login time to force re-auth
      });

      console.log('✓ Logged out from all devices');
    } catch (error) {
      console.error('Error logging out from all devices:', error);
    }
  }

  deleteAccount() {
    // TODO: Implement account deletion flow
    // This should show a confirmation modal with:
    // 1. Warning about permanent deletion
    // 2. Required confirmation input
    // 3. Password verification
    // 4. Final confirmation button

    console.log('Delete account flow initiated');
    // For now, just log - this is a dangerous operation that needs careful implementation
  }

  // Helper methods for blocked users modal
  getBlockedUserInitial(blockedUser: any): string {
    // For now, return first letter of blockedBy ID
    // In a real implementation, you'd fetch user details
    return blockedUser.blockedBy?.[0]?.toUpperCase() || 'U';
  }

  getBlockedUserName(blockedUser: any): string {
    // For now, return the ID
    // In a real implementation, you'd fetch user details from user service
    return blockedUser.blockedBy || 'Unknown User';
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
  submitSupportForm() {
    if (!this.supportSubject().trim() || !this.supportConcern().trim()) {
      return;
    }

    this.isSubmittingSupport.set(true);

    // TODO: Implement backend submission
    // For now, just simulate the submission process
    setTimeout(() => {
      console.log('✓ Support form submitted:', {
        subject: this.supportSubject(),
        concern: this.supportConcern(),
        user: this.userData()?.uid,
        timestamp: new Date().toISOString(),
      });

      // Reset form and show success state
      this.supportSubject.set('');
      this.supportConcern.set('');
      this.isSubmittingSupport.set(false);

      // Could show a success message here
      alert("Thank you for your feedback! We'll get back to you soon.");
    }, 2000);
  }

  // Legal section methods
  setLegalView(view: 'menu' | 'terms' | 'privacy' | 'guidelines' | 'about') {
    this.legalActiveView.set(view);
  }
}
