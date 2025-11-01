import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
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
                      'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20': isActor(),
                      'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20': !isActor(),
                      'opacity-60': !isEditingField('name')
                    }"
                  />
                  <button
                    (click)="toggleEditField('name')"
                    class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-600 border-purple-600 text-white hover:bg-purple-700': isActor() && isEditingField('name'),
                      'border-purple-900/30 text-purple-300 hover:bg-purple-950/20': isActor() && !isEditingField('name'),
                      'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700': !isActor() && isEditingField('name'),
                      'border-neutral-700 text-neutral-300 hover:bg-black/20': !isActor() && !isEditingField('name')
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
                      'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20': isActor(),
                      'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20': !isActor(),
                      'opacity-60': !isEditingField('email')
                    }"
                  />
                  <button
                    (click)="toggleEditField('email')"
                    class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-600 border-purple-600 text-white hover:bg-purple-700': isActor() && isEditingField('email'),
                      'border-purple-900/30 text-purple-300 hover:bg-purple-950/20': isActor() && !isEditingField('email'),
                      'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700': !isActor() && isEditingField('email'),
                      'border-neutral-700 text-neutral-300 hover:bg-black/20': !isActor() && !isEditingField('email')
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
                      'bg-purple-950/20 border-purple-900/30 text-purple-100 focus:border-purple-500 focus:ring-purple-500/20': isActor(),
                      'bg-black/20 border-neutral-700 text-neutral-200 focus:border-neutral-500 focus:ring-neutral-500/20': !isActor(),
                      'opacity-60': !isEditingField('phone')
                    }"
                  />
                  <button
                    (click)="toggleEditField('phone')"
                    class="px-3 py-2 text-xs rounded-lg border transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-600 border-purple-600 text-white hover:bg-purple-700': isActor() && isEditingField('phone'),
                      'border-purple-900/30 text-purple-300 hover:bg-purple-950/20': isActor() && !isEditingField('phone'),
                      'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700': !isActor() && isEditingField('phone'),
                      'border-neutral-700 text-neutral-300 hover:bg-black/20': !isActor() && !isEditingField('phone')
                    }"
                  >
                    {{ isEditingField('phone') ? 'Save' : 'Edit' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Account Type Section -->
            <div class="pt-6 border-t"
                 [ngClass]="{
                   'border-purple-900/20': isActor(),
                   'border-neutral-700/50': !isActor()
                 }">
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
                        'bg-purple-600/20 text-purple-300 border border-purple-600/30': isActor(),
                        'bg-neutral-600/20 text-neutral-300 border border-neutral-600/30': !isActor()
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
                      'bg-purple-600 border-purple-600 text-white hover:bg-purple-700': isActor(),
                      'bg-neutral-600 border-neutral-600 text-white hover:bg-neutral-700': !isActor()
                    }"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Add {{ getMissingRole() | titlecase }} Account
                  </button>
                }
              </div>
            </div>
          </div>
          } @case ('privacy') {
          <div class="space-y-8">
            <!-- Profile Visibility Section -->
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
              <div class="flex items-center justify-between p-4 rounded-lg"
                   [ngClass]="{
                     'bg-purple-950/10 border border-purple-900/20': isActor(),
                     'bg-black/20 border border-neutral-700/50': !isActor()
                   }">
                <div class="flex-1">
                  <h3 class="text-sm font-medium"
                      [ngClass]="{
                        'text-purple-200': isActor(),
                        'text-neutral-200': !isActor()
                      }">
                    Ghost Mode
                  </h3>
                  <p class="text-xs mt-1"
                     [ngClass]="{
                       'text-purple-300/60': isActor(),
                       'text-neutral-400': !isActor()
                     }">
                    Hide your profile from search results and discovery
                  </p>
                </div>
                <button
                  (click)="toggleGhostMode()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500': isActor() && ghostMode(),
                    'bg-purple-900/30 focus:ring-purple-500': isActor() && !ghostMode(),
                    'bg-neutral-600 focus:ring-neutral-500': !isActor() && ghostMode(),
                    'bg-neutral-700/50 focus:ring-neutral-500': !isActor() && !ghostMode()
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
              <div class="flex items-center justify-between p-4 rounded-lg"
                   [ngClass]="{
                     'bg-purple-950/10 border border-purple-900/20': isActor(),
                     'bg-black/20 border border-neutral-700/50': !isActor()
                   }">
                <div class="flex-1">
                  <h3 class="text-sm font-medium"
                      [ngClass]="{
                        'text-purple-200': isActor(),
                        'text-neutral-200': !isActor()
                      }">
                    Last Seen
                  </h3>
                  <p class="text-xs mt-1"
                     [ngClass]="{
                       'text-purple-300/60': isActor(),
                       'text-neutral-400': !isActor()
                     }">
                    Show when you were last active
                  </p>
                </div>
                <button
                  (click)="toggleLastSeenVisible()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500': isActor() && lastSeenVisible(),
                    'bg-purple-900/30 focus:ring-purple-500': isActor() && !lastSeenVisible(),
                    'bg-neutral-600 focus:ring-neutral-500': !isActor() && lastSeenVisible(),
                    'bg-neutral-700/50 focus:ring-neutral-500': !isActor() && !lastSeenVisible()
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
              <div class="flex items-center justify-between p-4 rounded-lg"
                   [ngClass]="{
                     'bg-purple-950/10 border border-purple-900/20': isActor(),
                     'bg-black/20 border border-neutral-700/50': !isActor()
                   }">
                <div class="flex-1">
                  <h3 class="text-sm font-medium"
                      [ngClass]="{
                        'text-purple-200': isActor(),
                        'text-neutral-200': !isActor()
                      }">
                    Online Status
                  </h3>
                  <p class="text-xs mt-1"
                     [ngClass]="{
                       'text-purple-300/60': isActor(),
                       'text-neutral-400': !isActor()
                     }">
                    Show when you're currently online
                  </p>
                </div>
                <button
                  (click)="toggleOnlineStatusVisible()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500': isActor() && onlineStatusVisible(),
                    'bg-purple-900/30 focus:ring-purple-500': isActor() && !onlineStatusVisible(),
                    'bg-neutral-600 focus:ring-neutral-500': !isActor() && onlineStatusVisible(),
                    'bg-neutral-700/50 focus:ring-neutral-500': !isActor() && !onlineStatusVisible()
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
              <div class="flex items-center justify-between p-4 rounded-lg"
                   [ngClass]="{
                     'bg-purple-950/10 border border-purple-900/20': isActor(),
                     'bg-black/20 border border-neutral-700/50': !isActor()
                   }">
                <div class="flex-1">
                  <h3 class="text-sm font-medium"
                      [ngClass]="{
                        'text-purple-200': isActor(),
                        'text-neutral-200': !isActor()
                      }">
                    Read Receipts
                  </h3>
                  <p class="text-xs mt-1"
                     [ngClass]="{
                       'text-purple-300/60': isActor(),
                       'text-neutral-400': !isActor()
                     }">
                    Send read receipts when you view messages
                  </p>
                </div>
                <button
                  (click)="toggleReadReceipts()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-purple-600 focus:ring-purple-500': isActor() && readReceipts(),
                    'bg-purple-900/30 focus:ring-purple-500': isActor() && !readReceipts(),
                    'bg-neutral-600 focus:ring-neutral-500': !isActor() && readReceipts(),
                    'bg-neutral-700/50 focus:ring-neutral-500': !isActor() && !readReceipts()
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
                <div class="flex items-center justify-between p-4 rounded-lg"
                     [ngClass]="{
                       'bg-purple-950/10 border border-purple-900/20': isActor(),
                       'bg-black/20 border border-neutral-700/50': !isActor()
                     }">
                  <div class="flex-1">
                    <h3 class="text-sm font-medium"
                        [ngClass]="{
                          'text-purple-200': isActor(),
                          'text-neutral-200': !isActor()
                        }">
                      Allow Chat Requests
                    </h3>
                    <p class="text-xs mt-1"
                       [ngClass]="{
                         'text-purple-300/60': isActor(),
                         'text-neutral-400': !isActor()
                       }">
                      Allow producers to send you chat requests
                    </p>
                  </div>
                  <button
                    (click)="toggleAllowChatRequests()"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    [ngClass]="{
                      'bg-purple-600 focus:ring-purple-500': allowChatRequests(),
                      'bg-purple-900/30 focus:ring-purple-500': !allowChatRequests()
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
                  'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200': isActor(),
                  'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200': !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                  </svg>
                  <div class="text-left">
                    <h3 class="text-sm font-medium">Blocked Users</h3>
                    <p class="text-xs opacity-70">View and manage blocked users</p>
                  </div>
                </div>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <!-- Recent Logins -->
              <button
                (click)="viewRecentLogins()"
                class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                [ngClass]="{
                  'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200': isActor(),
                  'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200': !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <div class="text-left">
                    <h3 class="text-sm font-medium">Recent Logins</h3>
                    <p class="text-xs opacity-70">View login history and active sessions</p>
                  </div>
                </div>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <!-- Logout All Devices -->
              <button
                (click)="logoutAllDevices()"
                class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
                [ngClass]="{
                  'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200': isActor(),
                  'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200': !isActor()
                }"
              >
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
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
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  <div class="text-left">
                    <h3 class="text-sm font-medium">Delete Account</h3>
                    <p class="text-xs opacity-70">Permanently delete your account</p>
                  </div>
                </div>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
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

  // User data signals
  userData = signal<UserDoc | null>(null);
  editableUserData = signal<{ name: string; email: string; phone: string }>({ 
    name: '', 
    email: '', 
    phone: '' 
  });
  editingFields = signal<Set<string>>(new Set());

  // Privacy settings signals
  ghostMode = signal<boolean>(false);
  lastSeenVisible = signal<boolean>(true);
  onlineStatusVisible = signal<boolean>(true);
  allowChatRequests = signal<boolean>(true);

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
    this.loadUserData();
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

  private async loadUserData() {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          this.userData.set(userData);
          this.userRole.set(userData.currentRole || 'actor');
          this.editableUserData.set({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || ''
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
          phone: currentUserData.phone || ''
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
        currentRole: missingRole // Switch to the newly added role
      });

      // Update local state
      this.userData.set({
        ...currentUserData,
        roles: updatedRoles,
        currentRole: missingRole
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
        this.userData.set({ ...currentUserData, lastSeen: updateData.lastSeen });
      }

      console.log(`✓ Last seen visibility ${newValue ? 'enabled' : 'disabled'}`);
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
        this.userData.set({ ...currentUserData, isOnline: updateData.isOnline });
      }

      console.log(`✓ Online status visibility ${newValue ? 'enabled' : 'disabled'}`);
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
    if (blockedUsers.length === 0) {
      console.log('No blocked users found');
      // TODO: Show modal or navigate to blocked users page
    } else {
      console.log('Blocked users:', blockedUsers);
      // TODO: Show modal with blocked users list
    }
  }

  viewRecentLogins() {
    const devices = this.userData()?.device || [];
    console.log('Recent login devices:', devices);
    // TODO: Show modal with recent login history
    // Could fetch from a separate login history collection
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
}
