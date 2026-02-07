import { Component, inject, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { LoadingService } from '../../services/loading.service';
import { AnalyticsService } from '../../services/analytics.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { DataExportService } from '../../services/data-export.service';
import { PaymentService } from '../../services/payment.service';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from '@angular/fire/firestore';
import { UserDoc, UserAnalytics } from '../../../assets/interfaces/interfaces';
import { Profile } from '../../../assets/interfaces/profile.interfaces';
import { PaymentTransaction } from '../../interfaces/payment.interfaces';
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
import { EmailChangeModalComponent } from './components/email-change-modal.component';
import { PaymentHistoryModalComponent } from './components/payment-history-modal.component';
import { OtpComponent } from '../../common-components/otp/otp.component';
import { OtpVerificationService } from '../../services/otp-verification.service';

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
    EmailChangeModalComponent,
    PaymentHistoryModalComponent,
    OtpComponent,
  ],
  templateUrl: './settings.component.html',
  styles: [],
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private firestore = inject(Firestore);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);
  private analyticsService = inject(AnalyticsService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private dataExportService = inject(DataExportService);
  private otpVerificationService = inject(OtpVerificationService);
  private paymentService = inject(PaymentService);

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
    console.log(
      profileData,
      profileData?.actorProfile?.isSubscribed,
      '>>>>>>>>>>>><<<<<<<<<<'
    );
    return profileData?.actorProfile?.isSubscribed ?? false;
  });

  readReceipts = signal<boolean>(true);

  // Active tab signal
  activeTab = signal<SettingsTab>('account');

  // Payment-related signals
  isProcessingPayment = signal<boolean>(false);
  showPaymentHistoryModal = signal<boolean>(false);
  paymentHistoryList = signal<PaymentTransaction[]>([]);

  // User data signals
  userData = signal<(UserDoc & Profile) | null>(null);
  editableUserData = signal<{ email: string; phone: string }>({
    email: '',
    phone: '',
  });
  editingFields = signal<Set<string>>(new Set());

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
  isDeleting = signal<boolean>(false);
  isExporting = signal<boolean>(false);

  // Add account modal signals
  showAddAccountModal = signal<boolean>(false);
  addAccountType = signal<'actor' | 'producer'>('actor');

  // Email change modal signals
  showEmailChangeModal = signal<boolean>(false);

  // OTP modal signals
  showOtpModal = signal<boolean>(false);
  otpPhoneNumber = signal<string>('');

  // OTP modal ViewChild reference
  @ViewChild('otpModal') otpModal!: OtpComponent;

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
    // Read tab query parameter
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const tabParam = params['tab'] as SettingsTab;
      const validTabs: SettingsTab[] = [
        'account',
        'privacy',
        'subscriptions',
        'analytics',
        'support',
        'legal',
      ];

      if (tabParam && validTabs.includes(tabParam)) {
        this.activeTab.set(tabParam);
      }
    });

    const user = this.auth.getCurrentUser();
    if (user) {
      await this.loadUserData();
      await this.profileService.loadProfileData();
    }
  }

  private isValidTab(tab: string): tab is SettingsTab {
    const validTabs: SettingsTab[] = [
      'account',
      'privacy',
      'subscriptions',
      'analytics',
      'support',
      'legal',
    ];
    return validTabs.includes(tab as SettingsTab);
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
    // Update URL with query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
  onEditableDataChange(data: { email: string; phone: string }) {
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

  async toggleEditField(field: 'email' | 'phone') {
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

  private async saveField(field: 'email' | 'phone') {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const currentData = this.editableUserData();
      const fieldValue = currentData[field].trim();

      // Validate the field value
      if (!fieldValue) {
        this.toastService.error(`${field} cannot be empty`);
        return;
      }

      // Additional validation for email
      if (field === 'email' && !this.isValidEmail(fieldValue)) {
        this.toastService.error('Please enter a valid email address');
        return;
      }

      // For phone number changes, require OTP verification
      if (field === 'phone') {
        const currentUserData = this.userData();
        const currentPhone = currentUserData?.phone || '';

        // Check if phone number actually changed
        if (fieldValue !== currentPhone) {
          // Validate phone number format (should be in format: +XX-XXXXXXXXXX)
          const phonePattern = /^\+\d{1,4}-\d{6,12}$/;
          if (!phonePattern.test(fieldValue)) {
            this.toastService.error(
              'Please enter a valid phone number in format: +XX-XXXXXXXXXX'
            );
            return;
          }

          // Format phone number for Firebase (remove hyphen for OTP)
          const phoneForOtp = fieldValue.replace('-', '');

          // Store the phone number for later use after OTP verification
          this.otpPhoneNumber.set(phoneForOtp);

          // Set modal state signal (for template binding)
          this.showOtpModal.set(true);

          // Open OTP modal using the component's open method
          // This ensures reCAPTCHA is properly initialized before sending OTP
          this.otpModal.open(phoneForOtp);

          return; // Don't save yet, wait for OTP verification
        }
      }

      // For email or unchanged phone, save directly
      const updateData: Partial<UserDoc> = {};
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

      this.toastService.success(
        `${field === 'email' ? 'Email' : 'Phone number'} updated successfully`
      );
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      this.toastService.error(`Failed to update ${field}`);
      // Revert the editable data on error
      const currentUserData = this.userData();
      if (currentUserData) {
        this.editableUserData.set({
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
    } catch (error) {
      console.error('Error adding account:', error);
      // Show error to user via modal
      throw error;
    }
  }

  // =========================
  // Email Change Modal Methods
  // =========================

  openEmailChangeModal() {
    this.showEmailChangeModal.set(true);
  }

  closeEmailChangeModal() {
    this.showEmailChangeModal.set(false);
    // Reload user data to get updated email
    this.loadUserData();
  }

  // =========================
  // OTP Modal Methods
  // =========================

  async onOtpVerified() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const currentData = this.editableUserData();
      const phoneValue = currentData.phone.trim();

      // Update phone number in Firestore
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, { phone: phoneValue });

      // Update the userData signal
      const currentUserData = this.userData();
      if (currentUserData) {
        this.userData.set({ ...currentUserData, phone: phoneValue });
      }

      // Remove phone from editing state
      const fields = new Set(this.editingFields());
      fields.delete('phone');
      this.editingFields.set(fields);

      // Close OTP modal
      this.showOtpModal.set(false);

      this.toastService.success('Phone number updated successfully');
    } catch (error) {
      console.error('Error updating phone after OTP verification:', error);
      this.toastService.error('Failed to update phone number');

      // Revert the editable data on error
      const currentUserData = this.userData();
      if (currentUserData) {
        this.editableUserData.set({
          email: currentUserData.email || '',
          phone: currentUserData.phone || '',
        });
      }
    }
  }

  onCloseOtpModal() {
    this.showOtpModal.set(false);

    // Revert phone number to original value
    const currentUserData = this.userData();
    if (currentUserData) {
      this.editableUserData.set({
        email: currentUserData.email || '',
        phone: currentUserData.phone || '',
      });
    }

    // Remove phone from editing state
    const fields = new Set(this.editingFields());
    fields.delete('phone');
    this.editingFields.set(fields);
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
    } catch (error) {
      console.error('Error updating chat request settings:', error);
      // Revert on error
      this.allowChatRequests.set(!this.allowChatRequests());
    }
  }

  // Account management methods
  async viewBlockedUsers() {
    const blockedUsers = this.userData()?.blocked || [];

    // Fetch user names dynamically for each blocked user
    const blockedUsersWithNames = await Promise.all(
      blockedUsers.map(async (blockedUser) => {
        try {
          const userDoc = await getDoc(
            doc(this.firestore, 'users', blockedUser.blockedBy)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserDoc;

            return {
              ...blockedUser,
              displayName: userData.name || 'Unknown User',
              role: userData.currentRole || 'user',
              blockedAt: blockedUser.date,
            };
          } else {
            console.warn('User document not found for:', blockedUser.blockedBy);
            return {
              ...blockedUser,
              displayName: blockedUser.blockedBy || 'Unknown User',
              role: 'user',
              blockedAt: blockedUser.date,
            };
          }
        } catch (error) {
          console.error(
            'Error fetching blocked user data for',
            blockedUser.blockedBy,
            error
          );
          return {
            ...blockedUser,
            displayName: blockedUser.blockedBy || 'Unknown User',
            role: 'user',
            blockedAt: blockedUser.date,
          };
        }
      })
    );

    this.blockedUsersList.set(blockedUsersWithNames);
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
      // Show initial toast notification
      this.toastService.info('Logging out of all devices...', 4000);

      // Close the modal
      this.closeRecentLoginsModal();

      // Wait a moment for user to see the initial toast
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Logout from all devices (clears device array and updates loggedInTime)
      await this.auth.logoutAllDevices(user.uid);

      // Show success toast
      this.toastService.success('Logged out of all devices successfully', 3000);

      // Wait longer for user to see the success message before navigating away
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Sign out the current user
      await this.auth.logout();

      // Force redirect to login page
      await this.router.navigate(['/auth/login'], {
        queryParams: { reason: 'logout-all-devices' },
        replaceUrl: true, // Replace current URL in history
      });
    } catch (error) {
      console.error('Error logging out from all devices:', error);
      this.toastService.error(
        'Failed to logout from all devices. Please try again.',
        5000
      );

      // On error, still try to redirect to login
      await this.router.navigate(['/auth/login']);
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

  async exportMyData() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    this.isExporting.set(true);

    try {
      const exportBlob = await this.dataExportService.exportUserData(user.uid);
      const filename = `castrole-data-export-${user.uid}-${Date.now()}.json`;

      this.dataExportService.downloadExport(exportBlob, filename);

      this.toastService.success('Data export downloaded successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.toastService.error('Failed to export data. Please try again.');
    } finally {
      this.isExporting.set(false);
    }
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
    const user = this.auth.getCurrentUser();

    if (!user) {
      this.isDeleting.set(false);
      return;
    }

    try {
      // Request account deletion (sets 30-day grace period)
      await this.auth.requestAccountDeletion(user.uid);

      // Show success message
      this.toastService.success(
        'Account deletion scheduled. You have 30 days to reactivate.'
      );

      // Close modal
      this.closeDeleteAccountModal();

      // Logout and redirect to login with reason
      await this.auth.logout();
      this.router.navigate(['/auth/login'], {
        queryParams: { reason: 'deletion-requested' },
      });
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      this.toastService.error('Failed to delete account. Please try again.');
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
  async upgradeSubscription(plan: 'monthly' | 'yearly') {
    const userData = this.userData();
    
    console.log('🔍 upgradeSubscription called with plan:', plan);
    console.log('🔍 userData:', userData);
    
    if (!userData) {
      console.error('❌ No userData found');
      this.toastService.error('User data not found. Please refresh the page.');
      return;
    }

    // Validate user has required data
    if (!userData.name || !userData.email || !userData.phone) {
      console.error('❌ Missing required fields:', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone
      });
      this.toastService.error('Please complete your profile before subscribing.');
      return;
    }

    try {
      this.isProcessingPayment.set(true);
      
      console.log('✓ Starting payment initiation...');

      // Initiate payment via PaymentService
      await this.paymentService.initiatePayment(plan, {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      });

      console.log('✓ Payment completed, reloading profile...');

      // Reload profile data to get updated subscription status
      await this.profileService.refreshProfileData();
      await this.loadUserData();

      this.toastService.success('Subscription activated successfully! Welcome to premium.');
      
      console.log('✓ Subscription activated:', plan);
    } catch (error: any) {
      console.error('❌ Payment error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      // Don't show error if user cancelled
      if (error.message !== 'Payment cancelled by user') {
        // Show more specific error message
        const errorMessage = error.message || error.details?.message || 'Payment failed. Please try again or contact support.';
        this.toastService.error(errorMessage);
      }
    } finally {
      this.isProcessingPayment.set(false);
    }
  }

  // Handlers passed to child components as callbacks
  upgradeToMonthlyHandler = () => this.upgradeSubscription('monthly');
  upgradeToYearlyHandler = () => this.upgradeSubscription('yearly');
  upgradeToYearlyFromAnalyticsHandler = () =>
    this.upgradeSubscription('yearly');

  async manageSubscription() {
    // Check if user has active subscription
    if (!this.profileService.isSubscriptionActive()) {
      this.toastService.info('You do not have an active subscription.');
      return;
    }

    // Get subscription details
    const metadata = this.profileService.getSubscriptionMetadata();
    const plan = this.profileService.getSubscriptionPlan();
    const endDate = this.profileService.getSubscriptionEndDate();
    const daysRemaining = this.profileService.getDaysRemaining();

    if (!metadata || !plan || !endDate) {
      this.toastService.error('Unable to load subscription details.');
      return;
    }

    // Show confirmation dialog
    const planName = plan === 'monthly' ? 'Monthly' : 'Yearly';
    const endDateStr = endDate.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const confirmed = confirm(
      `Cancel ${planName} Subscription?\n\n` +
      `Your subscription will remain active until ${endDateStr} (${daysRemaining} days).\n\n` +
      `Are you sure you want to cancel?`
    );

    if (!confirmed) return;

    // Ask for cancellation reason
    const reason = prompt(
      'Please tell us why you\'re cancelling (optional):\n\n' +
      'This helps us improve our service.'
    );

    try {
      const success = await this.paymentService.cancelSubscription(reason || undefined);

      if (success) {
        // Reload profile data
        await this.profileService.refreshProfileData();
        await this.loadUserData();

        this.toastService.success(
          `Subscription cancelled. You'll have access until ${endDateStr}.`
        );
        
        console.log('✓ Subscription cancelled');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  }

  async viewPaymentHistory() {
    try {
      // Fetch payment history from PaymentService
      const transactions = await this.paymentService.getPaymentHistory();
      
      this.paymentHistoryList.set(transactions);
      this.showPaymentHistoryModal.set(true);
      
      console.log('✓ Payment history loaded:', transactions.length, 'transactions');
    } catch (error) {
      console.error('Error loading payment history:', error);
      this.toastService.error('Failed to load payment history. Please try again.');
    }
  }

  closePaymentHistoryModal() {
    this.showPaymentHistoryModal.set(false);
  }

  // Support form methods
  async submitSupportForm() {
    if (!this.supportSubject().trim() || !this.supportConcern().trim()) {
      this.toastService.warning(
        'Please fill in both subject and description fields.',
        3000
      );
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user) {
      this.toastService.error(
        'You must be logged in to submit feedback.',
        3000
      );
      return;
    }

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

      // Reset form and show success state
      this.supportSubject.set('');
      this.supportConcern.set('');
      this.isSubmittingSupport.set(false);

      this.toastService.success(
        "Thank you for your feedback! We'll get back to you soon.",
        4000
      );
    } catch (error) {
      console.error('Error submitting support form:', error);
      this.isSubmittingSupport.set(false);
      this.toastService.error(
        'Failed to submit your feedback. Please try again.',
        5000
      );
    }
  }
}
