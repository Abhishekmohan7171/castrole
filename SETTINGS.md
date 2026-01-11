# Settings Implementation Documentation

## Overview

The Castrole settings system is a comprehensive, role-based configuration interface built with Angular 17's standalone components and signals. It features a modular architecture with query parameter routing for deep linking to specific tabs.

## Architecture

### Directory Structure

```
src/app/discover/settings/
├── settings.component.ts           # Main container component
├── components/
│   ├── settings-sidebar.component.ts    # Navigation sidebar
│   └── add-account-modal.component.ts   # Modal for adding alt accounts
└── sections/
    ├── account-section.component.ts     # Basic info & account management
    ├── analytics-section.component.ts   # Performance metrics (actors only)
    ├── privacy-section.component.ts     # Privacy & security settings
    ├── subscriptions-section.component.ts # Subscription plans
    ├── support-section.component.ts     # Help & feedback form
    └── legal-section.component.ts       # Terms, privacy policy, etc.
```

## Core Interfaces & Types

### SettingsTab Type

```typescript
export type SettingsTab =
  | 'account'
  | 'privacy'
  | 'subscriptions'
  | 'analytics'
  | 'support'
  | 'legal';
```

### UserDoc Interface (Partial)

```typescript
interface UserDoc {
  uid: string;
  email?: string;
  phone?: string;
  currentRole: 'actor' | 'producer';
  roles: string[];
  ghost?: boolean;
  lastSeen?: Date;
  isOnline?: boolean;
  allowChatRequests?: boolean;
  readReceipts?: boolean;
  blocked?: BlockedUser[];
  device?: DeviceInfo[];
}
```

### Analytics Interfaces

```typescript
interface AnalyticsViewModel {
  profileViews: number;
  avgProfileViewDuration: string;
  searchAppearances: number;
  totalVideoViews: number;
  avgVideoWatchTime: string;
  wishlistCount: number;
  visibilityScore: number;
  topVideo: {
    title: string;
    views: number;
    avgWatchTime: string;
  } | null;
  dailyData: DailyAnalyticsDoc[];
}

interface UserAnalyticsDoc {
  userId: string;
  profileViews: number;
  totalProfileViewMs: number;
  searchAppearances: number;
  totalVideoViews: number;
  totalWatchMs: number;
}
```

## Query Parameter Routing

The settings system supports deep linking via query parameters, allowing direct navigation to specific tabs.

### Implementation

```typescript
// Reading query parameters on init
async ngOnInit() {
  this.route.queryParams.pipe(take(1)).subscribe(params => {
    const tabParam = params['tab'] as SettingsTab;
    const validTabs: SettingsTab[] = ['account', 'privacy', 'subscriptions', 'analytics', 'support', 'legal'];

    if (tabParam && validTabs.includes(tabParam)) {
      this.activeTab.set(tabParam);
    }
  });
}

// Updating URL when tab changes
setActiveTab(tab: SettingsTab) {
  this.activeTab.set(tab);
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { tab },
    queryParamsHandling: 'merge',
    replaceUrl: true
  });
}
```

### Usage Examples

```typescript
// Navigate to analytics tab
this.router.navigate(['/discover/settings'], {
  queryParams: { tab: 'analytics' }
});

// Direct URL access
// https://app.castrole.com/discover/settings?tab=support
```

## Section Components

### 1. Account Section

**Purpose**: Manage basic user information and account roles

**Features**:
- Editable email and phone number
- Role management (switch between actor/producer)
- Add alternate account
- Real-time field validation

**Key Implementation**:

```typescript
@Component({
  selector: 'app-account-section',
  // ... config
})
export class AccountSectionComponent {
  // Inputs
  isActor = input.required<boolean>();
  userData = input.required<any>();
  editableUserData = input.required<any>();
  editingFields = input.required<Set<string>>();

  // Outputs
  dataChange = output<{ email: string; phone: string }>();

  // Local state for two-way binding
  localEditableData = signal<{ email: string; phone: string }>({
    email: '',
    phone: '',
  });

  // Update field and emit changes to parent
  updateField(field: 'email' | 'phone', event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    const newData = {
      ...this.localEditableData(),
      [field]: value
    };

    this.localEditableData.set(newData);
    this.dataChange.emit(newData);
  }
}
```

**Key Methods in Parent**:
- `toggleEditField(field)`: Enable/disable field editing
- `saveField(field)`: Validate and save to Firestore
- `switchRole()`: Switch between actor/producer roles
- `addAccount()`: Open modal to add alternate account

---

### 2. Analytics Section

**Purpose**: Display performance metrics for actors with premium subscriptions

**Features**:
- Profile views and average time on profile
- Search appearances tracking
- Video performance metrics
- Wishlist count
- Percentile-based visibility score (0-10)
- Top performing video

**Key Implementation**:

```typescript
@Component({
  selector: 'app-analytics-section',
  // ... config
})
export class AnalyticsSectionComponent implements OnInit {
  // State
  analytics = signal<AnalyticsViewModel>({
    profileViews: 0,
    avgProfileViewDuration: 'N/A',
    searchAppearances: 0,
    totalVideoViews: 0,
    avgVideoWatchTime: 'N/A',
    wishlistCount: 0,
    visibilityScore: 0,
    topVideo: null,
    dailyData: [],
  });

  isLoading = signal<boolean>(true);

  async ngOnInit() {
    await this.loadAnalytics();
  }

  private async loadAnalytics() {
    // 1. Load lifetime analytics
    const lifetimeData = await this.analyticsService.getLifetimeAnalytics(userId);

    // 2. Load wishlist count
    const wishlistCount = await this.analyticsService.getWishlistCount(userId);

    // 3. Calculate visibility score using percentile ranking
    const visibilityScore = await this.calculateVisibilityScore(
      lifetimeData?.profileViews || 0,
      wishlistCount,
      lifetimeData?.searchAppearances || 0,
      lifetimeData?.totalVideoViews || 0,
      lifetimeData?.totalWatchMs || 0
    );

    // 4. Update analytics signal
    this.analytics.set({...});
  }
}
```

**Visibility Score Algorithm**:

```typescript
// Percentile-based scoring (0-10 scale)
// Weights:
// - Profile views: 25%
// - Wishlist count: 35% (strongest signal)
// - Search appearances: 15%
// - Video views: 25%

private async calculateVisibilityScore(
  profileViews: number,
  wishlistCount: number,
  searchAppearances: number,
  totalVideoViews: number,
  totalWatchMs: number
): Promise<number> {
  const [profilePercentile, searchPercentile, videoPercentile] =
    await Promise.all([
      this.estimatePercentile('profileViews', profileViews),
      this.estimatePercentile('searchAppearances', searchAppearances),
      this.estimatePercentile('totalVideoViews', totalVideoViews),
    ]);

  const wishlistPercentile = Math.min(wishlistCount / 10, 1.0);

  // Weighted composite (0-1 scale)
  const composite =
    profilePercentile * 0.25 +
    wishlistPercentile * 0.35 +
    searchPercentile * 0.15 +
    videoPercentile * 0.25;

  return Math.round(composite * 10);
}
```

**Premium Gate**: Non-subscribed actors see an upgrade prompt instead of analytics data.

---

### 3. Privacy Section

**Purpose**: Configure privacy and security settings

**Features**:
- **Ghost Mode**: Hide profile from search results (actors & producers)
- **Last Seen**: Show/hide last active timestamp
- **Online Status**: Show/hide real-time online indicator
- **Read Receipts**: Send/hide message read confirmations
- **Allow Chat Requests**: Enable/disable incoming chat requests (actors only)
- **Blocked Users**: View and manage blocked users list
- **Recent Logins**: View device history and active sessions
- **Logout All Devices**: Sign out from all devices remotely
- **Delete Account**: Initiate account deletion (30-day grace period)

**Key Implementation**:

```typescript
@Component({
  selector: 'app-privacy-section',
  // ... config
})
export class PrivacySectionComponent {
  // Inputs (all required)
  isActor = input.required<boolean>();
  ghostMode = input.required<boolean>();
  lastSeenVisible = input.required<boolean>();
  onlineStatusVisible = input.required<boolean>();
  readReceipts = input.required<boolean>();
  allowChatRequests = input.required<boolean>();

  // Method inputs (callbacks to parent)
  toggleGhostMode = input.required<() => void>();
  toggleLastSeenVisible = input.required<() => void>();
  toggleOnlineStatusVisible = input.required<() => void>();
  toggleReadReceipts = input.required<() => void>();
  toggleAllowChatRequests = input.required<() => void>();
  viewBlockedUsers = input.required<() => void>();
  viewRecentLogins = input.required<() => void>();
  logoutAllDevices = input.required<() => void>();
  deleteAccount = input.required<() => void>();
}
```

**Parent Toggle Methods**:

```typescript
async toggleGhostMode() {
  const user = this.auth.getCurrentUser();
  if (!user) return;

  try {
    const newValue = !this.ghostMode();
    this.ghostMode.set(newValue);

    const userDocRef = doc(this.firestore, 'users', user.uid);
    await updateDoc(userDocRef, { ghost: newValue });

    // Update local state
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
```

---

### 4. Subscriptions Section

**Purpose**: Manage subscription plans and billing

**Features**:
- Current plan overview
- Monthly plan (₹222/month)
- Yearly plan (₹1,999/year - saves ₹665)
- Plan comparison
- Upgrade/downgrade options
- Payment history (TODO)

**Key Implementation**:

```typescript
@Component({
  selector: 'app-subscriptions-section',
  // ... config
})
export class SubscriptionsSectionComponent {
  isActor = input.required<boolean>();
  isSubscribed = input.required<boolean>();

  // Upgrade handlers passed from parent
  upgradeToMonthly = input.required<() => void>();
  upgradeToYearly = input.required<() => void>();
  manageSubscription = input.required<() => void>();
  viewPaymentHistory = input.required<() => void>();
}
```

**Parent Methods** (TODO - needs payment gateway integration):

```typescript
upgradeSubscription(plan: 'monthly' | 'yearly') {
  // TODO: Implement subscription upgrade flow
  // 1. Redirect to payment gateway
  // 2. Process payment
  // 3. Update user subscription status in Firestore
  console.log('✓ Upgrade subscription initiated:', plan);
}
```

---

### 5. Support Section

**Purpose**: Help, bug reports, and feedback submission

**Features**:
- Subject line input
- Detailed description textarea
- Form validation
- Submission to `support_tickets` collection
- Loading state during submission

**Key Implementation**:

```typescript
@Component({
  selector: 'app-support-section',
  // ... config
})
export class SupportSectionComponent {
  isActor = input.required<boolean>();
  supportSubject = input.required<string>();
  supportConcern = input.required<string>();
  isSubmittingSupport = input.required<boolean>();
  submitSupportForm = input.required<() => void>();

  // Local signals for two-way binding
  localSupportSubject = signal<string>('');
  localSupportConcern = signal<string>('');

  constructor() {
    // Sync with parent inputs
    effect(() => {
      this.localSupportSubject.set(this.supportSubject());
      this.localSupportConcern.set(this.supportConcern());
    });
  }
}
```

**Parent Submit Method**:

```typescript
async submitSupportForm() {
  // Validation with toast notifications
  if (!this.supportSubject().trim() || !this.supportConcern().trim()) {
    this.toastService.warning(
      'Please fill in both subject and description fields.',
      3000
    );
    return;
  }

  const user = this.auth.getCurrentUser();
  if (!user) {
    this.toastService.error('You must be logged in to submit feedback.', 3000);
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

    // Reset form
    this.supportSubject.set('');
    this.supportConcern.set('');
    this.isSubmittingSupport.set(false);

    // Success notification
    this.toastService.success(
      "Thank you for your feedback! We'll get back to you soon.",
      4000
    );
  } catch (error) {
    console.error('Error submitting support form:', error);
    this.isSubmittingSupport.set(false);

    // Error notification
    this.toastService.error(
      'Failed to submit your feedback. Please try again.',
      5000
    );
  }
}
```

**Firestore Indexes for Support Tickets**:

The following indexes are configured in `firestore.indexes.json` to optimize support ticket queries:

```json
{
  "indexes": [
    // Query tickets by user and creation date
    {
      "collectionGroup": "support_tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    // Query tickets by status and creation date (admin dashboard)
    {
      "collectionGroup": "support_tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    // Combined query for user's tickets filtered by status
    {
      "collectionGroup": "support_tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    // Query tickets by status and last update (for tracking responses)
    {
      "collectionGroup": "support_tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Example Queries Supported**:

```typescript
// Get all tickets for a specific user, sorted by newest first
const userTicketsQuery = query(
  collection(firestore, 'support_tickets'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
);

// Get all open tickets, sorted by creation date
const openTicketsQuery = query(
  collection(firestore, 'support_tickets'),
  where('status', '==', 'open'),
  orderBy('createdAt', 'desc')
);

// Get user's open tickets
const userOpenTicketsQuery = query(
  collection(firestore, 'support_tickets'),
  where('userId', '==', userId),
  where('status', '==', 'open'),
  orderBy('createdAt', 'desc')
);

// Get tickets by status, sorted by last update (for admin tracking)
const recentlyUpdatedQuery = query(
  collection(firestore, 'support_tickets'),
  where('status', '==', 'in_progress'),
  orderBy('updatedAt', 'desc')
);
```

---

### 6. Legal Section

**Purpose**: Display legal documents and company information

**Features**:
- Terms & Conditions
- Privacy Policy
- Community Guidelines
- About Us
- Multi-view navigation (menu → document → back to menu)

**Key Implementation**:

```typescript
@Component({
  selector: 'app-legal-section',
  // ... config
})
export class LegalSectionComponent implements OnInit {
  isActor = input.required<boolean>();

  legalActiveView = signal<'menu' | 'terms' | 'privacy' | 'guidelines' | 'about'>('menu');

  onSetLegalView(view: string) {
    this.legalActiveView.set(view as any);
  }

  onBackToMenu() {
    this.legalActiveView.set('menu');
  }
}
```

**Document Views**: Each legal document is rendered conditionally using `@switch` control flow:

```typescript
@switch (legalActiveView()) {
  @case ('menu') { /* Menu with document links */ }
  @case ('terms') { /* Terms & Conditions full text */ }
  @case ('privacy') { /* Privacy Policy full text */ }
  @case ('guidelines') { /* Community Guidelines */ }
  @case ('about') { /* About Castrole */ }
}
```

---

## Sidebar Component

**Purpose**: Navigation between settings sections with responsive mobile support

### Implementation

```typescript
@Component({
  selector: 'app-settings-sidebar',
  // ... config
})
export class SettingsSidebarComponent {
  // Inputs
  availableTabs = input.required<SettingsTab[]>();
  activeTab = input.required<SettingsTab>();
  isActor = input.required<boolean>();

  // Outputs
  tabChange = output<SettingsTab>();

  // Configuration methods
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

  getTabIcon(tab: SettingsTab): string {
    // Returns SVG path data for each tab icon
  }

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

  onTabClick(tab: SettingsTab): void {
    this.tabChange.emit(tab);
  }
}
```

### Available Tabs Logic

```typescript
// In main settings component
availableTabs = computed(() => {
  const tabs: SettingsTab[] = [
    'account',
    'privacy',
    'subscriptions',
    'support',
    'legal',
  ];

  // Analytics tab only for actors (with premium gate inside)
  if (this.isActor()) {
    tabs.splice(3, 0, 'analytics'); // Insert before 'support'
  }

  return tabs;
});
```

---

## State Management

The settings system uses Angular signals for reactive state management:

```typescript
// User role signals
userRole = signal<string>('actor');
isActor = computed(() => this.userRole() === 'actor');
isProducer = computed(() => this.userRole() === 'producer');

// Active tab
activeTab = signal<SettingsTab>('account');

// User data
userData = signal<(UserDoc & Profile) | null>(null);
editableUserData = signal<{ email: string; phone: string }>({
  email: '',
  phone: '',
});

// Privacy settings
ghostMode = signal<boolean>(false);
lastSeenVisible = signal<boolean>(true);
onlineStatusVisible = signal<boolean>(true);
allowChatRequests = signal<boolean>(true);
readReceipts = signal<boolean>(true);

// Modal states
showBlockedUsersModal = signal<boolean>(false);
showRecentLoginsModal = signal<boolean>(false);
showDeleteAccountModal = signal<boolean>(false);
```

---

## Theming

The settings UI adapts based on the user's role:

### Actor Theme
- Purple color scheme (`purple-600`, `purple-950/10`, etc.)
- Softer gradients and backgrounds
- Purple accent colors for interactive elements

### Producer Theme
- Neutral/gray color scheme (`neutral-600`, `black/20`, etc.)
- Professional appearance
- Neutral accent colors

### Dynamic Classes Example

```typescript
<div
  class="rounded-xl p-5 border backdrop-blur-xl"
  [ngClass]="{
    'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10': isActorTheme(),
    'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30': !isActorTheme()
  }"
>
```

---

## Responsive Design

### Mobile Sidebar
- Fixed position sidebar that slides in from left
- Backdrop overlay when open
- Auto-closes after tab selection
- Toggle button in mobile view

```typescript
// Mobile sidebar state
isMobileSidebarOpen = signal(false);

// Sidebar classes computation
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
```

---

## Integration with Profile Page

The settings system integrates with the profile page via a floating support button that appears when viewing other users' profiles:

```typescript
// In profile.component.ts
@if (!isViewingOwnProfile()) {
  <button
    (click)="navigateToSupport()"
    class="fixed bottom-6 right-6 z-40 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 ..."
  >
    <span>Report / Feedback</span>
  </button>
}

navigateToSupport() {
  this.router.navigate(['/discover/settings'], {
    queryParams: { tab: 'support' }
  });
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│           settings.component.ts (Parent)            │
│  ┌───────────────────────────────────────────────┐ │
│  │  - User data (signals)                        │ │
│  │  - Active tab state                           │ │
│  │  - Privacy settings                           │ │
│  │  - Firestore operations                       │ │
│  └───────────────────────────────────────────────┘ │
│                      ▲   │                          │
│                      │   │                          │
│                      │   ▼                          │
│  ┌───────────────────────────────────────────────┐ │
│  │         Section Components                     │ │
│  │  - Receive state via input()                  │ │
│  │  - Emit events via output()                   │ │
│  │  - Call parent methods via function inputs    │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  Firestore   │
                  └──────────────┘
```

### Data Flow Example: Toggling Ghost Mode

1. User clicks toggle in `privacy-section.component.ts`
2. Section component calls `toggleGhostMode()()` (function input from parent)
3. Parent component (`settings.component.ts`):
   - Updates local signal optimistically
   - Makes Firestore update
   - Updates userData signal with new value
   - On error, reverts the signal change
4. Privacy section reactively updates via input binding

---

## Best Practices

1. **Signal-Based State**: All mutable state uses signals for reactivity
2. **Computed Values**: Derived state uses `computed()` for automatic updates
3. **Optimistic Updates**: UI updates immediately, reverts on error
4. **Input Functions**: Parent methods passed as function inputs for type safety
5. **Error Handling**: Try-catch with rollback on failures
6. **Loading States**: Visual feedback during async operations
7. **Form Validation**: Client-side validation before Firestore updates
8. **Type Safety**: Strong typing with TypeScript interfaces
9. **Toast Notifications**: Use ToastService instead of alert() for user feedback
10. **Firestore Indexes**: Define composite indexes in `firestore.indexes.json` before deploying queries

### Deploying Firestore Indexes

After adding or modifying indexes in `firestore.indexes.json`, deploy them to Firebase:

```bash
# Deploy indexes to Firebase
firebase deploy --only firestore:indexes

# Or deploy all Firestore rules and indexes
firebase deploy --only firestore
```

**Important**: Index creation can take several minutes. Monitor progress in the Firebase Console under Firestore → Indexes.

---

## Future Enhancements

### Payment Integration
- Stripe/Razorpay integration for subscriptions
- Invoice generation and download
- Automatic subscription renewal
- Payment method management

### Enhanced Analytics
- Time-series charts for trends
- Comparative metrics (vs. similar profiles)
- Export analytics data (CSV/PDF)
- Custom date range selection

### Security Features
- Two-factor authentication (2FA)
- Password change functionality
- Security alerts for suspicious activity
- Session management with device details

### Account Management
- Profile export (GDPR compliance)
- Account recovery options
- Linked social accounts management
- Email verification flow

---

## Testing Considerations

### Unit Tests
- Signal reactivity
- Computed value derivation
- Input/output bindings
- Form validation logic

### Integration Tests
- Firestore operations
- Component communication
- Route navigation
- Query parameter handling

### E2E Tests
- Complete user flows (e.g., changing settings)
- Tab navigation
- Form submission
- Error handling

---

## Dependencies

```json
{
  "@angular/core": "^17.x",
  "@angular/common": "^17.x",
  "@angular/forms": "^17.x",
  "@angular/router": "^17.x",
  "@angular/fire": "^17.x",
  "firebase": "^10.x"
}
```

---

## Conclusion

The Castrole settings system provides a comprehensive, maintainable, and user-friendly interface for managing user preferences and account settings. Its modular architecture, signal-based state management, and role-specific theming create a polished experience that scales well with future feature additions.
