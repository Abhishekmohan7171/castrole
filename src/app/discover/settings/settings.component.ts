import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../../assets/interfaces/interfaces';

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

              @if (isActor()) {
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
              }

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
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-6">Account Settings</h2>
                  <div class="space-y-6">
                    <!-- Email -->
                    <div>
                      <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">email</label>
                      <div class="relative">
                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          value="user@example.com"
                          readonly
                          class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                          placeholder="swami vivekananda institute of film production"
                        />
                      </div>
                    </div>

                    <!-- Password -->
                    <div>
                      <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">password</label>
                      <div class="relative">
                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          value="••••••••••••"
                          readonly
                          class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <!-- Mobile -->
                    <div>
                      <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">mobile</label>
                      <div class="relative">
                        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          value="+91 9876543210"
                          readonly
                          class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <!-- Add Account -->
                    @if (!isActor()) {
                    <div class="pt-4">
                      <button class="w-full py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-neutral-400 hover:bg-neutral-800/80 hover:text-white transition-all flex items-center justify-center gap-2">
                        <span class="text-lg">add account</span>
                      </button>
                    </div>
                    }
                  </div>
                </div>
              }
              @case ('privacy') {
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-6">Privacy & Security</h2>
                  <div class="space-y-6">
                    <!-- Profile Visibility -->
                    <div class="space-y-4">
                      <h3 class="text-sm font-medium text-neutral-400 uppercase tracking-wide">profile visibility</h3>
                      
                      <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
                        <div>
                          <p class="text-white font-medium">ghost mode</p>
                          <p class="text-xs text-neutral-500 mt-1">hide your profile from search</p>
                        </div>
                        <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600">
                          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                        </button>
                      </div>
                    </div>

                    <!-- Account Management -->
                    <div class="space-y-4">
                      <h3 class="text-sm font-medium text-neutral-400 uppercase tracking-wide">account management</h3>
                      
                      <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
                        <div class="flex items-center gap-3">
                          <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span class="text-white">client forms</span>
                        </div>
                        <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
                        <div class="flex items-center gap-3">
                          <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span class="text-white">blocked users</span>
                        </div>
                        <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <button class="w-full flex items-center justify-between py-4 px-6 bg-red-900/20 rounded-xl border border-red-800/50 hover:bg-red-900/30 transition-all">
                        <div class="flex items-center gap-3">
                          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span class="text-red-400">delete account</span>
                        </div>
                        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <!-- Chat Settings -->
                    <div class="space-y-4">
                      <h3 class="text-sm font-medium text-neutral-400 uppercase tracking-wide">chat</h3>
                      
                      <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
                        <div>
                          <p class="text-white font-medium">last seen</p>
                        </div>
                        <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600">
                          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                        </button>
                      </div>

                      <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
                        <div>
                          <p class="text-white font-medium">online tag</p>
                        </div>
                        <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600">
                          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                        </button>
                      </div>

                      <div class="flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
                        <div>
                          <p class="text-white font-medium">read receipts</p>
                        </div>
                        <button 
                          (click)="toggleReadReceipts()"
                          [class]="readReceipts() 
                            ? 'relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors hover:bg-purple-700'
                            : 'relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600'"
                        >
                          <span 
                            [class]="readReceipts() 
                              ? 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6'
                              : 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1'"
                          ></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
              @case ('subscriptions') {
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-6">Subscriptions</h2>
                  <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-8 text-center">
                    <p class="text-neutral-400">Subscription management coming soon</p>
                  </div>
                </div>
              }
              @case ('analytics') {
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-6">Analytics</h2>
                  <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-8 text-center">
                    <p class="text-neutral-400">Analytics dashboard coming soon</p>
                  </div>
                </div>
              }
              @case ('support') {
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-6">Support & Feedback</h2>
                  <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-8 text-center">
                    <p class="text-neutral-400">Support options coming soon</p>
                  </div>
                </div>
              }
              @case ('legal') {
                <div>
                  <h2 class="text-2xl font-semibold text-white mb-6">Legal</h2>
                  <div class="space-y-4">
                    <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
                      <span class="text-white">terms & conditions</span>
                      <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
                      <span class="text-white">privacy policy</span>
                      <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
                      <span class="text-white">guidelines</span>
                      <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button class="w-full flex items-center justify-between py-4 px-6 bg-neutral-900/50 rounded-xl border border-neutral-800 hover:bg-neutral-800/50 transition-all">
                      <span class="text-white">about us</span>
                      <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
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

  readReceipts = signal<boolean>(true);

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
    this.loadPrivacySettings();
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
