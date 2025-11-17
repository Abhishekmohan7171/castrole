import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Profile Visibility Section (Actors & Producers) -->
      @if (isActor() || isProducer()) {
      <div class="space-y-4">
        <div
          class="text-xs font-medium uppercase tracking-wide"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Profile Visibility
        </div>

        <!-- Ghost Mode Toggle -->
        <div
          class="flex items-center justify-between p-4 rounded-lg"
          [ngClass]="{
            'bg-purple-950/10 border border-purple-900/20': isActor(),
            'bg-black/20 border border-white/10': !isActor()
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
              Ghost Mode
            </h3>
            <p
              class="text-xs mt-1"
              [ngClass]="{
                'text-purple-300/60': isActor(),
                'text-neutral-400': !isActor()
              }"
            >
              Hide your profile from search results and discovery
            </p>
          </div>
          <button
            (click)="toggleGhostMode()"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            [ngClass]="{
              'bg-purple-600 focus:ring-purple-500':
                isActor() && ghostMode(),
              'bg-purple-900/30 focus:ring-purple-500':
                isActor() && !ghostMode(),
              'bg-neutral-600 focus:ring-neutral-500':
                !isActor() && ghostMode(),
              'bg-neutral-800 focus:ring-neutral-500':
                !isActor() && !ghostMode()
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
          (click)="viewBlockedUsers()()"
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
          (click)="viewRecentLogins()()"
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
          (click)="logoutAllDevices()()"
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
          (click)="deleteAccount()()"
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
  `
})
export class PrivacySectionComponent {
  isActor = input.required<boolean>();
  isProducer = input.required<boolean>();
  ghostMode = input.required<boolean>();
  lastSeenVisible = input.required<boolean>();
  onlineStatusVisible = input.required<boolean>();
  readReceipts = input.required<boolean>();
  allowChatRequests = input.required<boolean>();
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