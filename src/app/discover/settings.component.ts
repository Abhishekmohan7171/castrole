import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { Profile } from '../../assets/interfaces/profile.interfaces';

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
  imports: [CommonModule, FormsModule],
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
          <nav class="space-y-2 text-sm">
            @for (tab of availableTabs(); track tab) {
            <button
              (click)="setActiveTab(tab)"
              class="w-full text-left rounded-xl px-4 py-4 transition-all duration-200 flex items-start gap-3"
              [ngClass]="{
                'bg-purple-900/20 text-purple-100/80':
                  isActor() && activeTab() === tab,
                'text-purple-300/60 hover:bg-purple-950/10':
                  isActor() && activeTab() !== tab,
                'bg-white/5 text-neutral-200':
                  !isActor() && activeTab() === tab,
                'text-neutral-300 hover:bg-white/5':
                  !isActor() && activeTab() !== tab
              }"
            >
              <!-- Icon -->
              <div class="flex-shrink-0 mt-0.5">
                <svg
                  class="w-5 h-5"
                  [ngClass]="{
                    'text-purple-300': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  [innerHTML]="getTabIcon(tab)"
                ></svg>
              </div>
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm">{{ getTabLabel(tab) }}</div>
                <div
                  class="text-xs mt-1 leading-relaxed"
                  [ngClass]="{
                    'text-purple-200/60': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  {{ getTabDescription(tab) }}
                </div>
              </div>
            </button>
            }
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
              class="text-xs font-medium uppercase tracking-wide mb-6"
              [ngClass]="{
                'text-purple-300/50': isActor(),
                'text-neutral-500': !isActor()
              }"
            >
              Basic Information
            </div>

            <!-- Edit User Information -->
            <div class="space-y-4">
              <!-- Username -->
              <div class="space-y-2">
                <label
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-purple-200/80': isActor(),
                    'text-neutral-300': !isActor()
                  }"
                >
                  Username
                </label>
                <div class="flex gap-3">
                  <input
                    type="text"
                    [(ngModel)]="editableUserData().name"
                    [disabled]="!isEditingField('name')"
                    class="flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20':
                        isActor(),
                      'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20':
                        !isActor(),
                      'opacity-60': !isEditingField('name')
                    }"
                  />
                  <button
                    (click)="toggleEditField('name')"
                    class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                        isActor() && isEditingField('name'),
                      'border-purple-900/30 text-purple-300 hover:bg-purple-950/20':
                        isActor() && !isEditingField('name'),
                      'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                        !isActor() && isEditingField('name'),
                      'border-neutral-700 text-neutral-300 hover:bg-black/20':
                        !isActor() && !isEditingField('name')
                    }"
                  >
                    {{ isEditingField('name') ? 'Save' : 'Edit' }}
                  </button>
                </div>
              </div>

              <!-- Email -->
              <div class="space-y-2">
                <label
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-purple-200/80': isActor(),
                    'text-neutral-300': !isActor()
                  }"
                >
                  Email
                </label>
                <div class="flex gap-3">
                  <input
                    type="email"
                    [(ngModel)]="editableUserData().email"
                    [disabled]="!isEditingField('email')"
                    class="flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20':
                        isActor(),
                      'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20':
                        !isActor(),
                      'opacity-60': !isEditingField('email')
                    }"
                  />
                  <button
                    (click)="toggleEditField('email')"
                    class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                        isActor() && isEditingField('email'),
                      'border-purple-900/30 text-purple-300 hover:bg-purple-950/20':
                        isActor() && !isEditingField('email'),
                      'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                        !isActor() && isEditingField('email'),
                      'border-neutral-700 text-neutral-300 hover:bg-black/20':
                        !isActor() && !isEditingField('email')
                    }"
                  >
                    {{ isEditingField('email') ? 'Save' : 'Edit' }}
                  </button>
                </div>
              </div>

              <!-- Mobile Number -->
              <div class="space-y-2">
                <label
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-purple-200/80': isActor(),
                    'text-neutral-300': !isActor()
                  }"
                >
                  Mobile Number
                </label>
                <div class="flex gap-3">
                  <input
                    type="tel"
                    [(ngModel)]="editableUserData().phone"
                    [disabled]="!isEditingField('phone')"
                    class="flex-1 px-3 py-2 text-sm rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20':
                        isActor(),
                      'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20':
                        !isActor(),
                      'opacity-60': !isEditingField('phone')
                    }"
                  />
                  <button
                    (click)="toggleEditField('phone')"
                    class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                        isActor() && isEditingField('phone'),
                      'border-purple-900/30 text-purple-300 hover:bg-purple-950/20':
                        isActor() && !isEditingField('phone'),
                      'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                        !isActor() && isEditingField('phone'),
                      'border-neutral-700 text-neutral-300 hover:bg-black/20':
                        !isActor() && !isEditingField('phone')
                    }"
                  >
                    {{ isEditingField('phone') ? 'Save' : 'Edit' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Account Type Section -->
            <div
              class="pt-6 border-t"
              [ngClass]="{
                'border-purple-900/20': isActor(),
                'border-neutral-700/50': !isActor()
              }"
            >
              <div
                class="text-xs font-medium uppercase tracking-wide mb-4"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Account Type
              </div>

              <div class="space-y-3">
                <!-- Current Roles Display -->
                <div class="flex flex-wrap gap-2">
                  @for (role of userData()?.roles || []; track role) {
                  <span
                    class="px-3 py-1 text-xs rounded-full"
                    [ngClass]="{
                      'bg-purple-600/20 text-purple-300 border border-purple-600/30':
                        isActor(),
                      'bg-neutral-600/20 text-neutral-300 border border-neutral-600/30':
                        !isActor()
                    }"
                  >
                    {{ role | titlecase }}
                  </span>
                  }
                </div>

                <!-- Add Account Button -->
                @if (canAddAccount()) {
                <button
                  (click)="addAccount()"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-600 border-purple-600 text-white hover:bg-purple-700':
                      isActor(),
                    'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700':
                      !isActor()
                  }"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add {{ getMissingRole() | titlecase }} Account
                </button>
                }
              </div>
            </div>
          </div>
          } @case ('privacy') {
          <div class="space-y-8">
            <!-- Profile Visibility Section (Actors Only) -->
            @if (isActor()) {
            <div class="space-y-4">
              <div
                class="text-xs font-medium uppercase tracking-wide text-purple-300/50"
              >
                Profile Visibility
              </div>

              <!-- Ghost Mode Toggle -->
              <div
                class="flex items-center justify-between p-4 rounded-lg bg-purple-950/10 border border-purple-900/20"
              >
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-purple-200">
                    Ghost Mode
                  </h3>
                  <p class="text-xs mt-1 text-purple-300/60">
                    Hide your profile from search results and discovery
                  </p>
                </div>
                <button
                  (click)="toggleGhostMode()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500': ghostMode(),
                    'bg-purple-900/30 focus:ring-purple-500': !ghostMode()
                  }"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    [ngClass]="{
                      'translate-x-6': ghostMode(),
                      'translate-x-1': !ghostMode()
                    }"
                  ></span>
                </button>
              </div>
            </div>
            }

            <!-- Chat Settings Section -->
            <div class="space-y-4">
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Chat Settings
              </div>

              <!-- Last Seen Toggle -->
              <div
                class="flex items-center justify-between p-4 rounded-lg"
                [ngClass]="{
                  'bg-purple-950/10 border border-purple-900/20': isActor(),
                  'bg-black/20 border border-neutral-700/50': !isActor()
                }"
              >
                <div class="flex-1">
                  <h3
                    class="text-sm font-medium"
                    [ngClass]="{
                      'text-purple-200': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    Last Seen
                  </h3>
                  <p
                    class="text-xs mt-1"
                    [ngClass]="{
                      'text-purple-300/60': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Show when you were last active
                  </p>
                </div>
                <button
                  (click)="toggleLastSeenVisible()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500':
                      isActor() && lastSeenVisible(),
                    'bg-purple-900/30 focus:ring-purple-500':
                      isActor() && !lastSeenVisible(),
                    'bg-neutral-600 focus:ring-neutral-500':
                      !isActor() && lastSeenVisible(),
                    'bg-neutral-700/50 focus:ring-neutral-500':
                      !isActor() && !lastSeenVisible()
                  }"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    [ngClass]="{
                      'translate-x-6': lastSeenVisible(),
                      'translate-x-1': !lastSeenVisible()
                    }"
                  ></span>
                </button>
              </div>

              <!-- Online Status Toggle -->
              <div
                class="flex items-center justify-between p-4 rounded-lg"
                [ngClass]="{
                  'bg-purple-950/10 border border-purple-900/20': isActor(),
                  'bg-black/20 border border-neutral-700/50': !isActor()
                }"
              >
                <div class="flex-1">
                  <h3
                    class="text-sm font-medium"
                    [ngClass]="{
                      'text-purple-200': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    Online Status
                  </h3>
                  <p
                    class="text-xs mt-1"
                    [ngClass]="{
                      'text-purple-300/60': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Show when you're currently online
                  </p>
                </div>
                <button
                  (click)="toggleOnlineStatusVisible()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500':
                      isActor() && onlineStatusVisible(),
                    'bg-purple-900/30 focus:ring-purple-500':
                      isActor() && !onlineStatusVisible(),
                    'bg-neutral-600 focus:ring-neutral-500':
                      !isActor() && onlineStatusVisible(),
                    'bg-neutral-700/50 focus:ring-neutral-500':
                      !isActor() && !onlineStatusVisible()
                  }"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    [ngClass]="{
                      'translate-x-6': onlineStatusVisible(),
                      'translate-x-1': !onlineStatusVisible()
                    }"
                  ></span>
                </button>
              </div>

              <!-- Read Receipts Toggle -->
              <div
                class="flex items-center justify-between p-4 rounded-lg"
                [ngClass]="{
                  'bg-purple-950/10 border border-purple-900/20': isActor(),
                  'bg-black/20 border border-neutral-700/50': !isActor()
                }"
              >
                <div class="flex-1">
                  <h3
                    class="text-sm font-medium"
                    [ngClass]="{
                      'text-purple-200': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    Read Receipts
                  </h3>
                  <p
                    class="text-xs mt-1"
                    [ngClass]="{
                      'text-purple-300/60': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Send read receipts when you view messages
                  </p>
                </div>
                <button
                  (click)="toggleReadReceipts()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500':
                      isActor() && readReceipts(),
                    'bg-purple-900/30 focus:ring-purple-500':
                      isActor() && !readReceipts(),
                    'bg-neutral-600 focus:ring-neutral-500':
                      !isActor() && readReceipts(),
                    'bg-neutral-700/50 focus:ring-neutral-500':
                      !isActor() && !readReceipts()
                  }"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    [ngClass]="{
                      'translate-x-6': readReceipts(),
                      'translate-x-1': !readReceipts()
                    }"
                  ></span>
                </button>
              </div>

              <!-- Chat Requests Toggle (for actors) -->
              @if (isActor()) {
              <div
                class="flex items-center justify-between p-4 rounded-lg"
                [ngClass]="{
                  'bg-purple-950/10 border border-purple-900/20': isActor(),
                  'bg-black/20 border border-neutral-700/50': !isActor()
                }"
              >
                <div class="flex-1">
                  <h3
                    class="text-sm font-medium"
                    [ngClass]="{
                      'text-purple-200': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    Allow Chat Requests
                  </h3>
                  <p
                    class="text-xs mt-1"
                    [ngClass]="{
                      'text-purple-300/60': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Allow producers to send you chat requests
                  </p>
                </div>
                <button
                  (click)="toggleAllowChatRequests()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500': allowChatRequests(),
                    'bg-purple-900/30 focus:ring-purple-500':
                      !allowChatRequests()
                  }"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    [ngClass]="{
                      'translate-x-6': allowChatRequests(),
                      'translate-x-1': !allowChatRequests()
                    }"
                  ></span>
                </button>
              </div>
              }
            </div>

            <!-- Account Management Section -->
            <div class="space-y-4">
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Account Management
              </div>

              <!-- View Blocked Users -->
              <button
                (click)="viewBlockedUsers()"
                class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                [ngClass]="{
                  'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                    isActor(),
                  'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                    !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                    />
                  </svg>
                  <div class="text-left">
                    <h3 class="text-sm font-medium">Blocked Users</h3>
                    <p class="text-xs opacity-70">
                      View and manage blocked users
                    </p>
                  </div>
                </div>
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <!-- Recent Logins -->
              <button
                (click)="viewRecentLogins()"
                class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                [ngClass]="{
                  'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                    isActor(),
                  'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                    !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div class="text-left">
                    <h3 class="text-sm font-medium">Recent Logins</h3>
                    <p class="text-xs opacity-70">
                      View login history and active sessions
                    </p>
                  </div>
                </div>
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <!-- Logout All Devices -->
              <button
                (click)="logoutAllDevices()"
                class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                [ngClass]="{
                  'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                    isActor(),
                  'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                    !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <div class="text-left">
                    <h3 class="text-sm font-medium">Logout All Devices</h3>
                    <p class="text-xs opacity-70">Sign out from all devices</p>
                  </div>
                </div>
              </button>

              <!-- Delete Account -->
              <button
                (click)="deleteAccount()"
                class="w-full flex items-center justify-between p-4 rounded-lg border border-red-600/30 bg-red-600/10 hover:bg-red-600/20 text-red-400 transition-all duration-200"
              >
                <div class="flex items-center gap-3">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <div class="text-left">
                    <h3 class="text-sm font-medium">Delete Account</h3>
                    <p class="text-xs opacity-70">
                      Permanently delete your account
                    </p>
                  </div>
                </div>
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
          } @case ('subscriptions') {
          <div class="space-y-8">
            <!-- Current Plan Section -->
            <div class="space-y-6">
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Here's what you're currently paying:
              </div>

              <!-- Current Plan Display -->
              <div class="space-y-3 text-sm">
                <div class="flex items-center gap-2">
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    [ngClass]="{
                      'bg-purple-400': isActor(),
                      'bg-neutral-400': !isActor()
                    }"
                  ></span>
                  <span
                    [ngClass]="{
                      'text-purple-200': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    Monthly Plan: ₹222 per month
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    [ngClass]="{
                      'bg-purple-400': isActor(),
                      'bg-neutral-400': !isActor()
                    }"
                  ></span>
                  <span
                    [ngClass]="{
                      'text-purple-200': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    Over a full year, that totals ₹2,664
                  </span>
                </div>
              </div>
            </div>

            <!-- Better Option Section -->
            <div class="space-y-6">
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Better Option – Yearly Plan:
              </div>

              <!-- Yearly Plan Benefits -->
              <div class="space-y-3 text-sm">
                <div class="flex items-center gap-2">
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    [ngClass]="{
                      'bg-purple-400': isActor(),
                      'bg-neutral-400': !isActor()
                    }"
                  ></span>
                  <span
                    [ngClass]="{
                      'text-purple-200': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    Yearly Plan: ₹2,222 per year
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  <span class="text-green-400 font-medium">
                    That means you save ₹442 compared to paying monthly!
                  </span>
                </div>
              </div>

              <!-- Upgrade Button -->
              <div class="pt-4">
                <button
                  (click)="upgradeSubscription()"
                  class="w-full max-w-xs mx-auto block px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-600 hover:bg-purple-700 text-white': isActor(),
                    'bg-neutral-600 hover:bg-neutral-700 text-white': !isActor()
                  }"
                >
                  yearly ₹2222
                </button>
              </div>
            </div>

            <!-- Why Upgrade Section -->
            <div class="space-y-6">
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Why Upgrade?
              </div>

              <!-- Benefits List -->
              <div class="space-y-4 text-sm">
                <div class="flex items-start gap-3">
                  <span
                    class="w-1.5 h-1.5 rounded-full mt-2"
                    [ngClass]="{
                      'bg-purple-400': isActor(),
                      'bg-neutral-400': !isActor()
                    }"
                  ></span>
                  <span
                    [ngClass]="{
                      'text-purple-200/80': isActor(),
                      'text-neutral-300': !isActor()
                    }"
                  >
                    Get all premium benefits for the whole year upfront.
                  </span>
                </div>

                <div class="flex items-start gap-3">
                  <span
                    class="w-1.5 h-1.5 rounded-full mt-2"
                    [ngClass]="{
                      'bg-purple-400': isActor(),
                      'bg-neutral-400': !isActor()
                    }"
                  ></span>
                  <span
                    [ngClass]="{
                      'text-purple-200/80': isActor(),
                      'text-neutral-300': !isActor()
                    }"
                  >
                    Enjoy high visibility, ad-free experience, upload up to 10
                    audition reels, and full analytics without worrying about
                    monthly renewals.
                  </span>
                </div>

                <div class="flex items-start gap-3">
                  <span
                    class="w-1.5 h-1.5 rounded-full mt-2"
                    [ngClass]="{
                      'bg-purple-400': isActor(),
                      'bg-neutral-400': !isActor()
                    }"
                  ></span>
                  <span
                    [ngClass]="{
                      'text-purple-200/80': isActor(),
                      'text-neutral-300': !isActor()
                    }"
                  >
                    One-time payment = peace of mind + savings.
                  </span>
                </div>
              </div>
            </div>

            <!-- Subscription Management Section -->
            <div
              class="pt-6 border-t space-y-4"
              [ngClass]="{
                'border-purple-900/20': isActor(),
                'border-neutral-700/50': !isActor()
              }"
            >
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Subscription Management
              </div>

              <!-- Management Options -->
              <div class="space-y-3">
                <!-- Manage Subscription -->
                <button
                  (click)="manageSubscription()"
                  class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <div class="flex items-center gap-3">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div class="text-left">
                      <h3 class="text-sm font-medium">Manage Subscription</h3>
                      <p class="text-xs opacity-70">
                        Update plan, payment method, or cancel
                      </p>
                    </div>
                  </div>
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <!-- Payment History -->
                <button
                  (click)="viewPaymentHistory()"
                  class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <div class="flex items-center gap-3">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div class="text-left">
                      <h3 class="text-sm font-medium">Payment History</h3>
                      <p class="text-xs opacity-70">
                        View past invoices and receipts
                      </p>
                    </div>
                  </div>
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          } @case ('analytics') {
          @if (isSubscribed()) {
          <div class="space-y-8">
            <!-- Profile Overview -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-purple-200">Profile Overview</h3>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Profile Views -->
                <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
                  <div class="text-xs text-purple-300/60 mb-1">Profile Views</div>
                  <div class="text-xs text-purple-300/60 mb-2">by Producers</div>
                  <div class="text-2xl font-bold text-purple-100">{{ analyticsData().profileOverview.profileViews.toLocaleString() }}</div>
                </div>
                
                <!-- Wishlist Count -->
                <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
                  <div class="text-xs text-purple-300/60 mb-1">Wishlist Count</div>
                  <div class="text-2xl font-bold text-purple-100 mt-4">{{ analyticsData().profileOverview.wishlistCount }}</div>
                </div>
                
                <!-- Avg Time on Profile -->
                <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
                  <div class="text-xs text-purple-300/60 mb-1">Avg. Time</div>
                  <div class="text-xs text-purple-300/60 mb-2">on Profile</div>
                  <div class="text-2xl font-bold text-purple-100">{{ analyticsData().profileOverview.avgTimeOnProfile }}</div>
                </div>
                
                <!-- Visibility Score -->
                <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20 flex flex-col items-center justify-center">
                  <!-- Circular progress indicator with centered content -->
                  <div class="relative w-24 h-24 mb-4">
                    <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        class="stroke-purple-900/30"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke-width="2"
                      />
                      <path
                        class="stroke-purple-400"
                        [attr.stroke-dasharray]="analyticsData().profileOverview.visibilityScore + ', 100'"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                    <!-- Centered content inside circle -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <div class="text-xs text-purple-300/60 font-medium tracking-wide">VISIBILITY</div>
                      <div class="text-xs text-purple-300/60 font-medium tracking-wide mb-1">SCORE</div>
                      <div class="text-xl font-bold text-purple-100">{{ analyticsData().profileOverview.visibilityScore }}</div>
                    </div>
                  </div>
                  
                  <div class="text-xs text-purple-300/50 text-center">
                    View your opportunity
                    <br>compared to your
                    <br>current talent segment
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Search Appearances -->
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-purple-200">Search Appearances</h3>
                <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <div class="text-2xl font-bold text-purple-100">{{ analyticsData().searchAppearances.count }}</div>
                      <div class="text-xs text-purple-300/60">Times your profile appeared in producer searches</div>
                    </div>
                  </div>
                  
                  <!-- Mock chart area -->
                  <div class="h-20 bg-purple-900/30 rounded-lg mb-4 flex items-end justify-center">
                    <svg class="w-full h-full p-2" viewBox="0 0 200 60">
                      <polyline
                        points="10,50 30,40 50,35 70,30 90,25 110,20 130,25 150,20 170,15 190,10"
                        fill="none"
                        stroke="#a855f7"
                        stroke-width="2"
                        class="drop-shadow-sm"
                      />
                    </svg>
                  </div>
                  
                  <!-- Videos they saw -->
                  <div class="space-y-2">
                    @for (video of analyticsData().searchAppearances.videos; track video.title) {
                    <div class="flex items-center gap-3 p-2 bg-purple-900/20 rounded-lg">
                      <div class="w-8 h-6 bg-purple-800/40 rounded flex items-center justify-center">
                        <svg class="w-3 h-3 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <span class="text-xs text-purple-200">{{ video.title }}</span>
                    </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Top Performing Video -->
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-purple-200">Top Performing Video</h3>
                <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
                  <div class="space-y-4">
                    <div>
                      <div class="text-sm font-medium text-purple-100 mb-1">{{ analyticsData().topPerformingVideo.title }}</div>
                      <div class="text-xs text-purple-300/60">{{ analyticsData().topPerformingVideo.views }}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div class="text-xs text-purple-300/60">Views</div>
                        <div class="text-sm font-medium text-purple-100">{{ analyticsData().topPerformingVideo.views }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-purple-300/60">Average</div>
                        <div class="text-xs text-purple-300/60">Watch Time</div>
                        <div class="text-sm font-medium text-purple-100">{{ analyticsData().topPerformingVideo.avgWatchTime }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tag Insights -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-purple-200">Tag Insights</h3>
              <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20 space-y-3">
                @for (tag of analyticsData().tagInsights; track tag.tag) {
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-purple-200">{{ tag.tag }}</span>
                    <span class="text-xs text-purple-300/60">{{ tag.percentage }}%</span>
                  </div>
                  <div class="w-full bg-purple-900/30 rounded-full h-2">
                    <div 
                      class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      [style.width.%]="tag.percentage"
                    ></div>
                  </div>
                </div>
                }
              </div>
            </div>

            <!-- Engagement Overview -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-purple-200">Engagement Overview <span class="text-xs text-purple-300/50 font-normal">Past 7 days</span></h3>
              <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
                <!-- Chart area -->
                <div class="h-32 bg-purple-900/30 rounded-lg mb-4 flex items-end justify-center">
                  <svg class="w-full h-full p-4" viewBox="0 0 300 100">
                    <polyline
                      points="20,80 60,70 100,65 140,60 180,55 220,50 260,45"
                      fill="none"
                      stroke="#a855f7"
                      stroke-width="2"
                      class="drop-shadow-sm"
                    />
                    <!-- Area fill -->
                    <polygon
                      points="20,80 60,70 100,65 140,60 180,55 220,50 260,45 260,90 20,90"
                      fill="url(#gradient)"
                      opacity="0.3"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#a855f7;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#a855f7;stop-opacity:0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div class="text-center">
                  <div class="text-xs text-purple-300/60">Your analytics will appear once engagement begins</div>
                </div>
              </div>
            </div>
          </div>
          } @else {
          <!-- Premium Upgrade Screen -->
          <div class="flex flex-col items-center justify-center py-20 px-6 text-center">
            <!-- Lock Icon -->
            <div class="mb-8">
              <svg 
                class="w-16 h-16 text-purple-400 mx-auto" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                viewBox="0 0 24 24"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            
            <!-- Upgrade Message -->
            <h3 class="text-lg font-medium text-purple-200 mb-8 max-w-md">
              Upgrade to premium for detailed analytics
            </h3>
            
            <!-- Go Premium Button -->
            <button 
              class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-full transition-colors duration-200"
              (click)="setActiveTab('subscriptions')"
            >
              go premium
            </button>
          </div>
          }
          } @case ('support') {
          <div class="space-y-8">
            <!-- Header -->
            <div class="space-y-2">
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Support & Feedback
              </div>
              <p
                class="text-sm"
                [ngClass]="{
                  'text-purple-200/70': isActor(),
                  'text-neutral-300': !isActor()
                }"
              >
                Have a question, found a bug, or want to share feedback? We're
                here to help!
              </p>
            </div>

            <!-- Support Form -->
            <form (ngSubmit)="submitSupportForm()" class="space-y-6">
              <!-- Subject Field -->
              <div class="space-y-2">
                <label
                  for="supportSubject"
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-purple-200/80': isActor(),
                    'text-neutral-300': !isActor()
                  }"
                >
                  Subject *
                </label>
                <input
                  id="supportSubject"
                  type="text"
                  [(ngModel)]="supportSubject"
                  name="supportSubject"
                  placeholder="Brief description of your issue or feedback"
                  required
                  class="w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  [ngClass]="{
                    'bg-purple-950/20 border-purple-900/30 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-500 focus:ring-purple-500/20':
                      isActor(),
                    'bg-black/20 border-neutral-700 text-neutral-200 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-neutral-500/20':
                      !isActor()
                  }"
                />
              </div>

              <!-- Concern/Description Field -->
              <div class="space-y-2">
                <label
                  for="supportConcern"
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-purple-200/80': isActor(),
                    'text-neutral-300': !isActor()
                  }"
                >
                  Describe your concern *
                </label>
                <textarea
                  id="supportConcern"
                  [(ngModel)]="supportConcern"
                  name="supportConcern"
                  placeholder="Please provide as much detail as possible to help us understand and address your concern..."
                  rows="6"
                  required
                  class="w-full px-4 py-3 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
                  [ngClass]="{
                    'bg-purple-950/20 border-purple-900/30 text-purple-100 placeholder:text-purple-300/40 focus:border-purple-500 focus:ring-purple-500/20':
                      isActor(),
                    'bg-black/20 border-neutral-700 text-neutral-200 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-neutral-500/20':
                      !isActor()
                  }"
                ></textarea>
                <p
                  class="text-xs"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  Include steps to reproduce if reporting a bug, or specific
                  suggestions if providing feedback.
                </p>
              </div>

              <!-- Submit Button -->
              <div class="pt-4">
                <button
                  type="submit"
                  [disabled]="
                    !supportSubject().trim() ||
                    !supportConcern().trim() ||
                    isSubmittingSupport()
                  "
                  class="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  [ngClass]="{
                    'bg-purple-600 hover:bg-purple-700 text-white disabled:hover:bg-purple-600':
                      isActor(),
                    'bg-neutral-600 hover:bg-neutral-700 text-white disabled:hover:bg-neutral-600':
                      !isActor()
                  }"
                >
                  @if (isSubmittingSupport()) {
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </div>
                  } @else { Submit Feedback }
                </button>
              </div>
            </form>

            <!-- Additional Help -->
            <div
              class="pt-6 border-t space-y-4"
              [ngClass]="{
                'border-purple-900/20': isActor(),
                'border-neutral-700/50': !isActor()
              }"
            >
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Other Ways to Get Help
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- FAQ/Documentation -->
                <a
                  href="#"
                  class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <h3 class="text-sm font-medium">Documentation</h3>
                    <p class="text-xs opacity-70">Browse help articles</p>
                  </div>
                </a>

                <!-- Contact -->
                <a
                  href="mailto:support&#64;castrole.com"
                  class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <h3 class="text-sm font-medium">Email Support</h3>
                    <p class="text-xs opacity-70">Direct contact</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
          } @case ('legal') {
          <div class="space-y-6">
            @switch (legalActiveView()) { @case ('menu') {
            <!-- Legal Menu -->
            <div class="space-y-6">
              <div
                class="text-xs font-medium uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                Legal Documents
              </div>

              <div class="space-y-3">
                <!-- Terms & Conditions -->
                <button
                  (click)="setLegalView('terms')"
                  class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <div class="flex items-center gap-3">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div class="text-left">
                      <h3 class="text-sm font-medium">Terms & Conditions</h3>
                      <p class="text-xs opacity-70">
                        Terms of service and usage
                      </p>
                    </div>
                  </div>
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <!-- Privacy Policy -->
                <button
                  (click)="setLegalView('privacy')"
                  class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <div class="flex items-center gap-3">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <div class="text-left">
                      <h3 class="text-sm font-medium">Privacy Policy</h3>
                      <p class="text-xs opacity-70">How we handle your data</p>
                    </div>
                  </div>
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <!-- Community Guidelines -->
                <button
                  (click)="setLegalView('guidelines')"
                  class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <div class="flex items-center gap-3">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <div class="text-left">
                      <h3 class="text-sm font-medium">Community Guidelines</h3>
                      <p class="text-xs opacity-70">
                        Rules and conduct standards
                      </p>
                    </div>
                  </div>
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <!-- About Us -->
                <button
                  (click)="setLegalView('about')"
                  class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                  [ngClass]="{
                    'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                      isActor(),
                    'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                      !isActor()
                  }"
                >
                  <div class="flex items-center gap-3">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div class="text-left">
                      <h3 class="text-sm font-medium">About Us</h3>
                      <p class="text-xs opacity-70">Company information</p>
                    </div>
                  </div>
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
            } @case ('terms') {
            <!-- Terms & Conditions Content -->
            <div class="space-y-6">
              <!-- Header with Back Button -->
              <div class="flex items-center gap-3">
                <button
                  (click)="setLegalView('menu')"
                  class="p-2 rounded-lg transition-colors"
                  [ngClass]="{
                    'hover:bg-purple-950/20 text-purple-300': isActor(),
                    'hover:bg-black/30 text-neutral-300': !isActor()
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h2
                    class="text-lg font-semibold"
                    [ngClass]="{
                      'text-purple-100': isActor(),
                      'text-neutral-100': !isActor()
                    }"
                  >
                    Terms & Conditions
                  </h2>
                  <p
                    class="text-xs"
                    [ngClass]="{
                      'text-purple-300/50': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Last updated: January 2025
                  </p>
                </div>
              </div>

              <!-- Terms Content -->
              <div
                class="space-y-4 text-sm max-h-screen overflow-y-auto"
                [ngClass]="{
                  'text-purple-200/80': isActor(),
                  'text-neutral-300': !isActor()
                }"
              >
                <div>
                  <h3 class="font-medium mb-2">1. Acceptance of Terms</h3>
                  <p>
                    By accessing and using Castrole, you accept and agree to be
                    bound by the terms and provision of this agreement.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">2. User Accounts</h3>
                  <p>
                    You are responsible for maintaining the confidentiality of
                    your account and password. You agree to accept
                    responsibility for all activities that occur under your
                    account.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">3. Platform Usage</h3>
                  <p>
                    Castrole provides a platform connecting actors and
                    producers. Users must use the service in accordance with
                    applicable laws and these terms.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">4. Content Guidelines</h3>
                  <p>
                    All content uploaded must be appropriate and comply with our
                    community guidelines. We reserve the right to remove content
                    that violates these terms.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">5. Limitation of Liability</h3>
                  <p>
                    Castrole shall not be liable for any direct, indirect,
                    incidental, special, or consequential damages resulting from
                    your use of the platform.
                  </p>
                </div>
              </div>
            </div>
            } @case ('privacy') {
            <!-- Privacy Policy Content -->
            <div class="space-y-6">
              <!-- Header with Back Button -->
              <div class="flex items-center gap-3">
                <button
                  (click)="setLegalView('menu')"
                  class="p-2 rounded-lg transition-colors"
                  [ngClass]="{
                    'hover:bg-purple-950/20 text-purple-300': isActor(),
                    'hover:bg-black/30 text-neutral-300': !isActor()
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h2
                    class="text-lg font-semibold"
                    [ngClass]="{
                      'text-purple-100': isActor(),
                      'text-neutral-100': !isActor()
                    }"
                  >
                    Privacy Policy
                  </h2>
                  <p
                    class="text-xs"
                    [ngClass]="{
                      'text-purple-300/50': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Last updated: January 2025
                  </p>
                </div>
              </div>

              <!-- Privacy Content -->
              <div
                class="space-y-4 text-sm max-h-screen overflow-y-auto"
                [ngClass]="{
                  'text-purple-200/80': isActor(),
                  'text-neutral-300': !isActor()
                }"
              >
                <div>
                  <h3 class="font-medium mb-2">Information We Collect</h3>
                  <p>
                    We collect information you provide directly to us, such as
                    when you create an account, update your profile, or contact
                    us for support.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">How We Use Your Information</h3>
                  <p>
                    We use the information we collect to provide, maintain, and
                    improve our services, process transactions, and communicate
                    with you.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Information Sharing</h3>
                  <p>
                    We do not sell, trade, or rent your personal information to
                    third parties. We may share your information in certain
                    limited circumstances as outlined in this policy.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Data Security</h3>
                  <p>
                    We implement appropriate security measures to protect your
                    personal information against unauthorized access,
                    alteration, disclosure, or destruction.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Your Rights</h3>
                  <p>
                    You have the right to access, update, or delete your
                    personal information. You may also opt out of certain
                    communications from us.
                  </p>
                </div>
              </div>
            </div>
            } @case ('guidelines') {
            <!-- Community Guidelines Content -->
            <div class="space-y-6">
              <!-- Header with Back Button -->
              <div class="flex items-center gap-3">
                <button
                  (click)="setLegalView('menu')"
                  class="p-2 rounded-lg transition-colors"
                  [ngClass]="{
                    'hover:bg-purple-950/20 text-purple-300': isActor(),
                    'hover:bg-black/30 text-neutral-300': !isActor()
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h2
                    class="text-lg font-semibold"
                    [ngClass]="{
                      'text-purple-100': isActor(),
                      'text-neutral-100': !isActor()
                    }"
                  >
                    Community Guidelines
                  </h2>
                  <p
                    class="text-xs"
                    [ngClass]="{
                      'text-purple-300/50': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Last updated: January 2025
                  </p>
                </div>
              </div>

              <!-- Guidelines Content -->
              <div
                class="space-y-4 text-sm max-h-screen overflow-y-auto"
                [ngClass]="{
                  'text-purple-200/80': isActor(),
                  'text-neutral-300': !isActor()
                }"
              >
                <div>
                  <h3 class="font-medium mb-2">Respectful Communication</h3>
                  <p>
                    Treat all community members with respect and
                    professionalism. Harassment, discrimination, or abusive
                    behavior is not tolerated.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Authentic Content</h3>
                  <p>
                    Share only authentic content that accurately represents your
                    work and capabilities. Misleading information or
                    impersonation is prohibited.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Professional Conduct</h3>
                  <p>
                    Maintain professional standards in all interactions. This
                    includes timely communication and honoring commitments made
                    through the platform.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Content Standards</h3>
                  <p>
                    All uploaded content must be appropriate for a professional
                    environment. Explicit, offensive, or inappropriate material
                    will be removed.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Reporting Violations</h3>
                  <p>
                    If you encounter behavior that violates these guidelines,
                    please report it through our support system. We take all
                    reports seriously.
                  </p>
                </div>
              </div>
            </div>
            } @case ('about') {
            <!-- About Us Content -->
            <div class="space-y-6">
              <!-- Header with Back Button -->
              <div class="flex items-center gap-3">
                <button
                  (click)="setLegalView('menu')"
                  class="p-2 rounded-lg transition-colors"
                  [ngClass]="{
                    'hover:bg-purple-950/20 text-purple-300': isActor(),
                    'hover:bg-black/30 text-neutral-300': !isActor()
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h2
                    class="text-lg font-semibold"
                    [ngClass]="{
                      'text-purple-100': isActor(),
                      'text-neutral-100': !isActor()
                    }"
                  >
                    About Us
                  </h2>
                  <p
                    class="text-xs"
                    [ngClass]="{
                      'text-purple-300/50': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Learn more about Castrole
                  </p>
                </div>
              </div>

              <!-- About Content -->
              <div
                class="space-y-4 text-sm max-h-screen overflow-y-auto"
                [ngClass]="{
                  'text-purple-200/80': isActor(),
                  'text-neutral-300': !isActor()
                }"
              >
                <div>
                  <h3 class="font-medium mb-2">Our Mission</h3>
                  <p>
                    Castrole is dedicated to connecting talented actors with
                    visionary producers, creating opportunities in the
                    entertainment industry.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">What We Do</h3>
                  <p>
                    We provide a platform where actors can showcase their
                    talents and producers can discover the perfect talent for
                    their projects.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Our Values</h3>
                  <p>
                    We believe in fostering creativity, promoting diversity, and
                    supporting the dreams of entertainment professionals
                    worldwide.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Company Information</h3>
                  <p>
                    Founded in 2024, Castrole is committed to revolutionizing
                    how the entertainment industry connects and collaborates.
                  </p>
                </div>

                <div>
                  <h3 class="font-medium mb-2">Contact Us</h3>
                  <p>
                    Have questions? Reach out to us at support&#64;castrole.com
                    or through our support form in the settings.
                  </p>
                </div>
              </div>
            </div>
            } }
          </div>
          } }
        </section>
      </div>

      <!-- Blocked Users Modal -->
      @if (showBlockedUsersModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div
          class="w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
          [ngClass]="{
            'bg-purple-950/20 border border-purple-900/30 backdrop-blur-xl':
              isActor(),
            'bg-neutral-900/90 border border-neutral-700/50 backdrop-blur-xl':
              !isActor()
          }"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2
              class="text-lg font-semibold"
              [ngClass]="{
                'text-purple-100': isActor(),
                'text-neutral-100': !isActor()
              }"
            >
              Blocked Users
            </h2>
            <button
              (click)="closeBlockedUsersModal()"
              class="p-2 rounded-full transition-colors"
              [ngClass]="{
                'hover:bg-purple-900/20 text-purple-300': isActor(),
                'hover:bg-neutral-700/50 text-neutral-300': !isActor()
              }"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            @if (blockedUsersList().length === 0) {
            <div class="text-center py-8">
              <svg
                class="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                />
              </svg>
              <p
                class="text-sm"
                [ngClass]="{
                  'text-purple-300/60': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                No blocked users
              </p>
            </div>
            } @else {
            <div class="space-y-3">
              @for (blockedUser of blockedUsersList(); track
              blockedUser.blockedBy) {
              <div
                class="flex items-center justify-between p-3 rounded-lg"
                [ngClass]="{
                  'bg-purple-950/10 border border-purple-900/20': isActor(),
                  'bg-neutral-800/50 border border-neutral-700/30': !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    [ngClass]="{
                      'bg-purple-900/30 text-purple-300': isActor(),
                      'bg-neutral-700 text-neutral-300': !isActor()
                    }"
                  >
                    {{ getBlockedUserInitial(blockedUser) }}
                  </div>
                  <div>
                    <p
                      class="text-sm font-medium"
                      [ngClass]="{
                        'text-purple-100': isActor(),
                        'text-neutral-100': !isActor()
                      }"
                    >
                      {{ getBlockedUserName(blockedUser) }}
                    </p>
                    <p
                      class="text-xs"
                      [ngClass]="{
                        'text-purple-300/60': isActor(),
                        'text-neutral-400': !isActor()
                      }"
                    >
                      Blocked {{ formatBlockedDate(blockedUser.date) }}
                    </p>
                  </div>
                </div>
                <button
                  (click)="unblockUser(blockedUser)"
                  class="px-3 py-1 text-xs rounded-full border transition-colors"
                  [ngClass]="{
                    'border-purple-600 text-purple-300 hover:bg-purple-600/20':
                      isActor(),
                    'border-neutral-600 text-neutral-300 hover:bg-neutral-600/20':
                      !isActor()
                  }"
                >
                  Unblock
                </button>
              </div>
              }
            </div>
            }
          </div>
        </div>
      </div>
      }

      <!-- Recent Logins Modal -->
      @if (showRecentLoginsModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div
          class="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
          [ngClass]="{
            'bg-purple-950/20 border border-purple-900/30 backdrop-blur-xl':
              isActor(),
            'bg-neutral-900/90 border border-neutral-700/50 backdrop-blur-xl':
              !isActor()
          }"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2
              class="text-lg font-semibold"
              [ngClass]="{
                'text-purple-100': isActor(),
                'text-neutral-100': !isActor()
              }"
            >
              Recent Logins
            </h2>
            <button
              (click)="closeRecentLoginsModal()"
              class="p-2 rounded-full transition-colors"
              [ngClass]="{
                'hover:bg-purple-900/20 text-purple-300': isActor(),
                'hover:bg-neutral-700/50 text-neutral-300': !isActor()
              }"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            @if (recentLoginsList().length === 0) {
            <div class="text-center py-8">
              <svg
                class="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p
                class="text-sm"
                [ngClass]="{
                  'text-purple-300/60': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                No login history available
              </p>
            </div>
            } @else {
            <div class="space-y-3">
              @for (login of recentLoginsList(); track $index) {
              <div
                class="flex items-center justify-between p-4 rounded-lg"
                [ngClass]="{
                  'bg-purple-950/10 border border-purple-900/20': isActor(),
                  'bg-neutral-800/50 border border-neutral-700/30': !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    [ngClass]="{
                      'bg-purple-900/30 text-purple-300': isActor(),
                      'bg-neutral-700 text-neutral-300': !isActor()
                    }"
                  >
                    {{ getDeviceIcon(login.platform) }}
                  </div>
                  <div>
                    <p
                      class="text-sm font-medium"
                      [ngClass]="{
                        'text-purple-100': isActor(),
                        'text-neutral-100': !isActor()
                      }"
                    >
                      {{ getDeviceDisplayName(login) }}
                    </p>
                    <p
                      class="text-xs"
                      [ngClass]="{
                        'text-purple-300/60': isActor(),
                        'text-neutral-400': !isActor()
                      }"
                    >
                      {{ login.platform | titlecase }}
                      @if (login.version) { · {{ login.version }}
                      }
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p
                    class="text-xs"
                    [ngClass]="{
                      'text-purple-300/60': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    Current Session
                  </p>
                  <div class="flex items-center gap-1 mt-1">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    <span class="text-xs text-green-400">Active</span>
                  </div>
                </div>
              </div>
              }
            </div>
            }
          </div>

          <!-- Footer -->
          <div
            class="mt-6 pt-4 border-t"
            [ngClass]="{
              'border-purple-900/20': isActor(),
              'border-neutral-700/30': !isActor()
            }"
          >
            <button
              (click)="logoutAllDevices(); closeRecentLoginsModal()"
              class="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              [ngClass]="{
                'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/30':
                  isActor(),
                'bg-neutral-700/50 hover:bg-neutral-700/70 text-neutral-300 border border-neutral-600':
                  !isActor()
              }"
            >
              Logout All Devices
            </button>
          </div>
        </div>
      </div>
      }
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
  private profileService = inject(ProfileService);

  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
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
      visibilityScore: 76
    },
    searchAppearances: {
      count: 186,
      videos: [
        { title: 'Video 1', thumbnail: '' },
        { title: 'Video 2', thumbnail: '' }
      ]
    },
    topPerformingVideo: {
      title: 'Video Title',
      views: '1.3M views',
      avgWatchTime: '3m 20s'
    },
    tagInsights: [
      { tag: 'Comedy', percentage: 85 },
      { tag: 'Drama', percentage: 65 }
    ]
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

  private async loadUserData() {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as (UserDoc & Profile);
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
