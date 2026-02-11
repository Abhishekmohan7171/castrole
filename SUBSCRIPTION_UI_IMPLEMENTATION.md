# Subscription Status UI Implementation Guide

## 🎯 Objective
Add visual indicators to show users their active subscription status in the Subscriptions section.

---

## 📋 Current vs. Required State

### Current State ❌
- User subscribes successfully
- `isSubscribed` flag set to `true` in Firestore
- Subscription metadata saved
- **UI shows no indication of active subscription**
- User cannot see which plan they're on
- No expiry date displayed

### Required State ✅
- Active plan highlighted with green border
- "✓ Active Plan" badge on current subscription
- Checkmark icon instead of arrow
- Expiry date displayed below plan
- Disabled click on active plan (prevent re-subscription)
- Visual distinction between active and available plans

---

## 🔧 Implementation Steps

### Step 1: Update `subscriptions-section.component.ts`

**File:** `d:\Angular\castrole\src\app\discover\settings\sections\subscriptions-section.component.ts`

#### A. Add Input Signals (Line 5)

```typescript
import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriptions-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Template will be updated below -->
  `,
})
export class SubscriptionsSectionComponent {
  // Existing outputs
  upgradeToMonthly = output<void>();
  upgradeToYearly = output<void>();
  manageSubscription = output<void>();

  // ✅ NEW: Add subscription status inputs
  isSubscribed = input<boolean>(false);
  currentPlan = input<'monthly' | 'yearly' | null>(null);
  subscriptionEndDate = input<Date | null>(null);
  daysRemaining = input<number | null>(null);

  // Existing signals
  showConfirmModal = signal(false);
  selectedPlan = signal<'monthly' | 'yearly'>('monthly');

  selectPlan(plan: 'monthly' | 'yearly') {
    // ✅ NEW: Prevent selecting current active plan
    if (this.isSubscribed() && this.currentPlan() === plan) {
      return; // Do nothing if trying to select active plan
    }
    
    this.selectedPlan.set(plan);
    this.showConfirmModal.set(true);
  }

  closeModal() {
    this.showConfirmModal.set(false);
  }

  confirmUpgrade() {
    if (this.selectedPlan() === 'monthly') {
      this.upgradeToMonthly.emit();
    } else {
      this.upgradeToYearly.emit();
    }
    this.closeModal();
  }
}
```

#### B. Update Template - Monthly Plan Card

Replace the monthly plan `<div>` (starting around line 10):

```typescript
<!-- Monthly Plan Card -->
<div 
  (click)="selectPlan('monthly')" 
  [class.border-green-500/70]="isSubscribed() && currentPlan() === 'monthly'"
  [class.bg-green-900/10]="isSubscribed() && currentPlan() === 'monthly'"
  [class.shadow-green-500/20]="isSubscribed() && currentPlan() === 'monthly'"
  [class.cursor-not-allowed]="isSubscribed() && currentPlan() === 'monthly'"
  [class.cursor-pointer]="!(isSubscribed() && currentPlan() === 'monthly')"
  class="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-8 border border-gray-700/50 transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
  
  <!-- ✅ NEW: Active Plan Badge -->
  @if (isSubscribed() && currentPlan() === 'monthly') {
    <div class="absolute -top-3 right-4 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      Active Plan
    </div>
  }
  
  <div class="flex items-baseline justify-between mb-8">
    <div class="flex items-baseline gap-2">
      <span class="text-5xl font-bold text-white">₹222</span>
      <span class="text-gray-400 text-sm">/month</span>
    </div>
    
    <!-- ✅ UPDATED: Button shows checkmark if active -->
    <button 
      [class.border-green-500]="isSubscribed() && currentPlan() === 'monthly'"
      [class.bg-green-500]="isSubscribed() && currentPlan() === 'monthly'"
      class="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center transition-all duration-300 group-hover:border-purple-500 group-hover:bg-purple-500/10">
      
      @if (isSubscribed() && currentPlan() === 'monthly') {
        <!-- Checkmark for active plan -->
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      } @else {
        <!-- Arrow for available plan -->
        <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      }
    </button>
  </div>
  
  <h3 class="text-xl font-bold text-white mb-3">monthly plan</h3>
  <p class="text-gray-400 text-sm mb-8">your starter plan to showcase your talent.</p>
  
  <!-- Features list (unchanged) -->
  <div class="space-y-4">
    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">what's included</p>
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-gray-300 text-sm">high visibility in searches</span>
      </div>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-gray-300 text-sm">upload up to 10 audition reels</span>
      </div>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-gray-300 text-sm">ad-free experience</span>
      </div>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-gray-300 text-sm">full analytics access</span>
      </div>
    </div>
  </div>
  
  <!-- ✅ NEW: Subscription Details (shown only if active) -->
  @if (isSubscribed() && currentPlan() === 'monthly') {
    <div class="mt-6 pt-6 border-t border-green-500/20">
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Status</span>
          <span class="text-green-400 font-medium">Active</span>
        </div>
        @if (subscriptionEndDate()) {
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">Valid Until</span>
            <span class="text-white font-medium">{{ subscriptionEndDate() | date:'mediumDate' }}</span>
          </div>
        }
        @if (daysRemaining() !== null) {
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">Days Remaining</span>
            <span 
              [class.text-red-400]="daysRemaining()! <= 7"
              [class.text-yellow-400]="daysRemaining()! > 7 && daysRemaining()! <= 14"
              [class.text-green-400]="daysRemaining()! > 14"
              class="font-medium">
              {{ daysRemaining() }} days
            </span>
          </div>
        }
      </div>
    </div>
  }
  
  <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
</div>
```

#### C. Update Template - Yearly Plan Card

Apply the same pattern to the yearly plan card (around line 50):

```typescript
<!-- Yearly Plan Card -->
<div 
  (click)="selectPlan('yearly')" 
  [class.border-green-500/70]="isSubscribed() && currentPlan() === 'yearly'"
  [class.bg-green-900/10]="isSubscribed() && currentPlan() === 'yearly'"
  [class.shadow-green-500/20]="isSubscribed() && currentPlan() === 'yearly'"
  [class.cursor-not-allowed]="isSubscribed() && currentPlan() === 'yearly'"
  [class.cursor-pointer]="!(isSubscribed() && currentPlan() === 'yearly')"
  class="group relative bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-2xl p-8 border border-purple-500/30 transition-all duration-300 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
  
  <!-- Savings badge (always shown) -->
  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
    save ₹442 vs monthly
  </div>
  
  <!-- ✅ NEW: Active Plan Badge -->
  @if (isSubscribed() && currentPlan() === 'yearly') {
    <div class="absolute -top-3 right-4 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      Active Plan
    </div>
  }
  
  <div class="flex items-baseline justify-between mb-8">
    <div class="flex items-baseline gap-2">
      <span class="text-5xl font-bold text-white">₹2,222</span>
      <span class="text-purple-300 text-sm">/year</span>
    </div>
    
    <!-- ✅ UPDATED: Button shows checkmark if active -->
    <button 
      [class.border-green-500]="isSubscribed() && currentPlan() === 'yearly'"
      [class.bg-green-500]="isSubscribed() && currentPlan() === 'yearly'"
      class="w-10 h-10 rounded-full border-2 border-purple-500 bg-purple-500/10 flex items-center justify-center transition-all duration-300 group-hover:bg-purple-500 group-hover:scale-110">
      
      @if (isSubscribed() && currentPlan() === 'yearly') {
        <!-- Checkmark for active plan -->
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      } @else {
        <!-- Arrow for available plan -->
        <svg class="w-5 h-5 text-purple-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      }
    </button>
  </div>
  
  <h3 class="text-xl font-bold text-white mb-3">yearly plan</h3>
  <p class="text-purple-200 text-sm mb-8">get all premium features with yearly savings.</p>
  
  <!-- Features list (unchanged) -->
  <div class="space-y-4">
    <p class="text-xs font-semibold text-purple-300/70 uppercase tracking-wider">what's included</p>
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-white text-sm font-medium">high visibility in searches</span>
      </div>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-white text-sm font-medium">upload up to 10 audition reels</span>
      </div>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-white text-sm font-medium">ad-free experience</span>
      </div>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span class="text-white text-sm font-medium">full analytics access</span>
      </div>
    </div>
  </div>
  
  <!-- ✅ NEW: Subscription Details (shown only if active) -->
  @if (isSubscribed() && currentPlan() === 'yearly') {
    <div class="mt-6 pt-6 border-t border-green-500/20">
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-purple-300">Status</span>
          <span class="text-green-400 font-medium">Active</span>
        </div>
        @if (subscriptionEndDate()) {
          <div class="flex items-center justify-between text-sm">
            <span class="text-purple-300">Valid Until</span>
            <span class="text-white font-medium">{{ subscriptionEndDate() | date:'mediumDate' }}</span>
          </div>
        }
        @if (daysRemaining() !== null) {
          <div class="flex items-center justify-between text-sm">
            <span class="text-purple-300">Days Remaining</span>
            <span 
              [class.text-red-400]="daysRemaining()! <= 7"
              [class.text-yellow-400]="daysRemaining()! > 7 && daysRemaining()! <= 14"
              [class.text-green-400]="daysRemaining()! > 14"
              class="font-medium">
              {{ daysRemaining() }} days
            </span>
          </div>
        }
      </div>
    </div>
  }
  
  <div class="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
</div>
```

---

### Step 2: Update `settings.component.html`

**File:** `d:\Angular\castrole\src\app\discover\settings\settings.component.html`

Find the `<app-subscriptions-section>` tag and update it:

```html
<!-- Before -->
<app-subscriptions-section
  (upgradeToMonthly)="upgradeToMonthlyHandler()"
  (upgradeToYearly)="upgradeToYearlyHandler()"
  (manageSubscription)="manageSubscription()"
/>

<!-- After -->
<app-subscriptions-section
  [isSubscribed]="isSubscribed()"
  [currentPlan]="profileService.getSubscriptionPlan()"
  [subscriptionEndDate]="profileService.getSubscriptionEndDate()"
  [daysRemaining]="profileService.getDaysRemaining()"
  (upgradeToMonthly)="upgradeToMonthlyHandler()"
  (upgradeToYearly)="upgradeToYearlyHandler()"
  (manageSubscription)="manageSubscription()"
/>
```

---

### Step 3: Verify ProfileService Methods

**File:** `d:\Angular\castrole\src\app\services\profile.service.ts`

Ensure these methods exist (they already do):

```typescript
getSubscriptionPlan(): 'monthly' | 'yearly' | null
getSubscriptionEndDate(): Date | null
getDaysRemaining(): number | null
isSubscriptionActive(): boolean
```

---

## 🎨 Visual Design Specifications

### Active Plan Styling
- **Border:** `border-green-500/70` (green with 70% opacity)
- **Background:** `bg-green-900/10` (subtle green tint)
- **Shadow:** `shadow-green-500/20` (green glow)
- **Badge:** Green pill with checkmark icon
- **Button:** Green background with white checkmark

### Color Coding for Days Remaining
- **> 14 days:** Green (`text-green-400`)
- **7-14 days:** Yellow (`text-yellow-400`)
- **≤ 7 days:** Red (`text-red-400`)

### Interaction States
- **Active Plan:** `cursor-not-allowed` (cannot click)
- **Available Plan:** `cursor-pointer` (clickable)
- **Hover:** Purple glow (only on available plans)

---

## 🧪 Testing Checklist

### Manual Testing

1. **No Subscription State**
   - [ ] Both plans show arrow icons
   - [ ] Both plans are clickable
   - [ ] No "Active Plan" badges visible
   - [ ] No subscription details shown

2. **Monthly Subscription Active**
   - [ ] Monthly plan has green border
   - [ ] "✓ Active Plan" badge visible on monthly
   - [ ] Checkmark icon instead of arrow
   - [ ] Expiry date displayed
   - [ ] Days remaining shown with correct color
   - [ ] Monthly plan not clickable
   - [ ] Yearly plan still clickable (for upgrade)

3. **Yearly Subscription Active**
   - [ ] Yearly plan has green border
   - [ ] "✓ Active Plan" badge visible on yearly
   - [ ] Checkmark icon instead of arrow
   - [ ] Expiry date displayed
   - [ ] Days remaining shown with correct color
   - [ ] Yearly plan not clickable
   - [ ] Monthly plan still clickable (for downgrade)

4. **Expiring Soon (≤ 7 days)**
   - [ ] Days remaining shows in red
   - [ ] All other indicators still work

5. **After Payment Completion**
   - [ ] UI updates automatically
   - [ ] Active plan badge appears
   - [ ] Subscription details populate
   - [ ] No page refresh needed

---

## 🚀 Deployment Steps

1. **Update Component File**
   ```bash
   # Edit subscriptions-section.component.ts
   # Add input signals and update selectPlan logic
   ```

2. **Update Template**
   ```bash
   # Update both plan cards with new conditional rendering
   ```

3. **Update Parent Component**
   ```bash
   # Edit settings.component.html
   # Pass subscription data to child component
   ```

4. **Test Locally**
   ```bash
   ng serve
   # Navigate to Settings > Subscriptions
   # Test all scenarios above
   ```

5. **Verify Change Detection**
   ```bash
   # Complete a test payment
   # Verify UI updates without refresh
   ```

6. **Build & Deploy**
   ```bash
   ng build --configuration production
   firebase deploy
   ```

---

## 📊 Expected User Experience

### Scenario 1: New User (No Subscription)
```
User sees:
- Two plan cards with equal visual weight
- Arrow icons on both cards
- "Save ₹442" badge on yearly plan
- Both cards are clickable
```

### Scenario 2: User Subscribes to Monthly
```
Payment completes →
UI updates automatically →
User sees:
- Monthly card with green border and glow
- "✓ Active Plan" badge on monthly
- Checkmark icon on monthly
- Subscription details: Valid until [date], X days remaining
- Yearly card still available for upgrade
```

### Scenario 3: Subscription Expiring Soon
```
7 days before expiry →
User sees:
- Days remaining in RED
- All other active indicators still present
- Encourages renewal
```

---

## 🔍 Troubleshooting

### Issue: UI Not Updating After Payment
**Solution:**
```typescript
// Ensure ChangeDetectorRef is being called in settings.component.ts
setTimeout(async () => {
  await this.profileService.refreshProfileData();
  await this.loadUserData();
  this.cdr.detectChanges(); // ✅ This is critical
}, 0);
```

### Issue: Subscription Data Not Showing
**Solution:**
```typescript
// Check that ProfileService methods return correct data
console.log('Plan:', this.profileService.getSubscriptionPlan());
console.log('End Date:', this.profileService.getSubscriptionEndDate());
console.log('Days:', this.profileService.getDaysRemaining());
```

### Issue: Both Plans Showing as Active
**Solution:**
```typescript
// Verify only one plan is set in Firestore
// Check actorProfile.subscriptionMetadata.plan value
```

---

## 📝 Summary

This implementation adds complete visual feedback for subscription status, making it immediately clear to users:
- Which plan they're currently on
- When their subscription expires
- How many days remain
- Which plans are available for upgrade/downgrade

The design uses Angular 19 signals and control flow for reactive, performant UI updates.

**Estimated Implementation Time:** 30-45 minutes  
**Complexity:** Low-Medium  
**Impact:** High (Critical UX improvement)
