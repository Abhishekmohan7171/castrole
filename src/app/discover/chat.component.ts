import { Component, OnDestroy, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, debounceTime, distinctUntilChanged, filter, map, of, shareReplay, startWith, switchMap, take, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { ActorService } from '../services/actor.service';
import { UserDoc, Message, Conversation, ChatMessage, ChatRoom, UserRole } from '../../assets/interfaces/interfaces';
import { ProducersService } from '../services/producers.service';
import { UserService } from '../services/user.service';
import { LoaderComponent } from '../common-components/loader/loader.component';
import { PresenceService } from '../services/presence.service';
import { BlockService } from '../services/block.service';

@Component({
  selector: 'app-discover-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent],
  template: `
    <div class="h-[calc(100vh-120px)] max-h-[calc(100vh-120px)] overflow-hidden text-neutral-200 flex flex-col"
         [ngClass]="{'actor-theme': myRole() === 'actor'}">
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-full flex-1 overflow-hidden pb-6">
        <!-- Conversations (sidebar) -->
        <aside
          class="rounded-2xl ring-1 border overflow-hidden hidden lg:flex lg:flex-col h-full transition-all duration-300"
          [ngClass]="{
            'bg-purple-950/10 ring-purple-900/10 border-purple-950/10': myRole() === 'actor',
            'bg-neutral-900/60 ring-white/10 border-white/5': myRole() !== 'actor'
          }"
        >
          <div class="p-4 border-b relative transition-colors duration-300"
               [ngClass]="{'border-purple-900/10': myRole() === 'actor', 'border-white/5': myRole() !== 'actor'}">
            <!-- Universal Search Input -->
            <input
              type="search"
              [formControl]="searchControl"
              placeholder="search conversations or messages"
              (focus)="openSearchResults()"
              (blur)="closeSearchResultsLater()"
              class="w-full rounded-full px-4 py-2 outline-none ring-1 transition text-sm"
              [ngClass]="{
                'bg-purple-950/10 text-purple-100 placeholder-purple-300/50 ring-purple-900/15 focus:ring-2 focus:ring-purple-500/30': myRole() === 'actor',
                'bg-neutral-900 text-neutral-200 placeholder-neutral-500 ring-white/10 focus:ring-2 focus:ring-fuchsia-500/30': myRole() !== 'actor'
              }"
            />
            
            <!-- Search Results Dropdown -->
            @if (showSearchResults && (searchResults().conversations.length > 0 || isSearching())) {
              <div class="absolute left-4 right-4 mt-2 z-10 max-h-72 overflow-auto rounded-xl ring-1 border shadow-xl transition-colors duration-300"
                   [ngClass]="{
                     'bg-purple-950/10 ring-purple-900/10 border-purple-950/10': myRole() === 'actor',
                     'bg-neutral-900 ring-white/10 border-white/5': myRole() !== 'actor'
                   }">
                @if (isSearching()) {
                  <div class="px-3 py-3 text-sm"
                       [ngClass]="{'text-purple-300/60': myRole() === 'actor', 'text-neutral-400': myRole() !== 'actor'}">
                    Searching...
                  </div>
                }
                @if (!isSearching()) {
                  @for (convo of searchResults().conversations; track convo.id) {
                    <button type="button" (mousedown)="$event.preventDefault()" (click)="selectSearchResult(convo)"
                            class="w-full text-left px-3 py-2 transition flex items-center gap-3"
                            [ngClass]="{'hover:bg-purple-950/10': myRole() === 'actor', 'hover:bg-white/5': myRole() !== 'actor'}">
                      <div class="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300"
                           [ngClass]="{
                             'bg-purple-950/10 text-purple-300/50': myRole() === 'actor',
                             'bg-white/10 text-neutral-400': myRole() !== 'actor'
                           }">
                        {{ convo.name[0] | uppercase }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="truncate text-sm"
                           [ngClass]="{'text-purple-100/80': myRole() === 'actor', 'text-neutral-100': myRole() !== 'actor'}">
                          {{ convo.name }}
                        </p>
                        @if (searchResults().messageMatches.get(convo.id); as matchCount) {
                          <p class="truncate text-xs"
                             [ngClass]="{'text-purple-300/60': myRole() === 'actor', 'text-neutral-400': myRole() !== 'actor'}">
                            {{ matchCount }} message{{ matchCount > 1 ? 's' : '' }} found
                          </p>
                        }
                      </div>
                    </button>
                  }
                }
              </div>
            }
            
            <!-- Actor View Mode Tabs (below search) -->
            @if (myRole() === 'actor') {
              <div class="flex items-center gap-3 mt-3">
                <button 
                  type="button" 
                  (click)="setViewMode('chat')" 
                  class="px-4 py-1.5 rounded-full text-sm ring-1 transition relative"
                  [ngClass]="{
                    'bg-purple-900/20 ring-purple-900/15 hover:bg-purple-950/10 text-purple-200': viewMode() === 'chat',
                    'ring-purple-900/15 hover:bg-purple-950/10 text-purple-300/60': viewMode() !== 'chat'
                  }">
                  chat
                  @if (totalUnreadCount(); as unreadCount) {
                    @if (unreadCount > 0) {
                      <span class="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-xs animate-pulse">
                        {{ unreadCount }}
                      </span>
                    }
                  }
                </button>
                <button 
                  type="button" 
                  (click)="setViewMode('requests')" 
                  class="px-4 py-1.5 rounded-full text-sm ring-1 transition relative"
                  [ngClass]="{
                    'bg-purple-900/20 ring-purple-900/15 hover:bg-purple-950/10 text-purple-200': viewMode() === 'requests',
                    'ring-purple-900/15 hover:bg-purple-950/10 text-purple-300/60': viewMode() !== 'requests'
                  }">
                  requests
                  @if (requestsCount(); as reqCount) {
                    @if (reqCount > 0) {
                      <span class="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-xs animate-pulse">
                        {{ reqCount }}
                      </span>
                    }
                  }
                </button>
              </div>
            }
          </div>
          <ul class="divide-y overflow-y-auto flex-1 scrollbar-thin scrollbar-track-transparent transition-colors duration-300"
              [ngClass]="{
                'divide-purple-900/10 scrollbar-thumb-purple-900/20': myRole() === 'actor',
                'divide-white/5 scrollbar-thumb-neutral-700': myRole() !== 'actor'
              }">
            <!-- Regular chat conversation item -->
            <li
              *ngFor="let c of conversations()"
              [ngClass]="{
                'bg-purple-900/20': c.id === active()?.id && myRole() === 'actor',
                'bg-white/10': c.id === active()?.id && myRole() !== 'actor',
                'cursor-pointer hover:bg-purple-950/10': (myRole() === 'actor' && viewMode() !== 'requests'),
                'cursor-pointer hover:bg-white/5': (myRole() !== 'actor' || viewMode() !== 'requests')
              }"
              class="px-4 py-3 transition flex items-center gap-3"
            >
              <!-- Avatar -->
              <div
                class="h-9 w-9 rounded-full flex items-center justify-center transition-colors duration-300"
                [ngClass]="{
                  'bg-purple-950/10 text-purple-300/50': myRole() === 'actor',
                  'bg-white/10 text-neutral-400': myRole() !== 'actor'
                }"
              >
                {{ c.name[0] | uppercase }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0 cursor-pointer" (click)="handleDesktopItemClick(c)">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm"
                     [ngClass]="{'text-purple-100/80': myRole() === 'actor', 'text-neutral-100': myRole() !== 'actor'}">
                    {{ c.name }}</p>
                  <ng-container *ngIf="c.unreadCount && meUid">
                    <span
                      *ngIf="c.unreadCount[meUid] > 0"
                      class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full text-white animate-pulse"
                      [ngClass]="{
                        'bg-purple-500': myRole() === 'actor',
                        'bg-fuchsia-600': myRole() !== 'actor'
                      }"
                      >{{ c.unreadCount[meUid] }}</span
                    >
                  </ng-container>
                </div>
                <p class="truncate text-xs"
                   [ngClass]="{'text-purple-200/60': myRole() === 'actor', 'text-neutral-400': myRole() !== 'actor'}">
                  {{ c.last }}</p>
              </div>

              <!-- Accept/Reject buttons for actor requests -->
              <div *ngIf="myRole() === 'actor' && viewMode() === 'requests'" class="flex gap-2">
                <button
                  (click)="acceptRequest(c)"
                  class="w-8 h-8 flex items-center justify-center rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 transition"
                  title="Accept"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button
                  (click)="rejectRequest(c)"
                  class="w-8 h-8 flex items-center justify-center rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                  title="Reject"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </aside>

        <!-- Messages panel -->
        <section
          class="rounded-2xl ring-1 border flex flex-col h-full overflow-hidden transition-all duration-300"
          [ngClass]="{
            'bg-purple-950/10 ring-purple-900/10 border-purple-950/10': myRole() === 'actor',
            'bg-neutral-900/60 ring-white/10 border-white/5': myRole() !== 'actor'
          }"
        >
          <!-- Mobile conversations header -->
          <div
            class="lg:hidden p-4 border-b border-white/5 flex items-center gap-3"
          >
            <button
              type="button"
              (click)="mobileListOpen = !mobileListOpen"
              class="px-3 py-1.5 rounded-full text-xs ring-1 ring-white/10 text-neutral-300 bg-white/5"
            >
              conversations
            </button>
            <div class="text-sm text-neutral-400">
              {{ active()?.name || 'select a chat' }}
            </div>
          </div>

          <!-- Mobile conversations drawer -->
          <div *ngIf="mobileListOpen" class="lg:hidden border-b border-white/5">
            <ul class="max-h-[40vh] overflow-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              <li
                *ngFor="let c of conversations()"
                [ngClass]="{ 'bg-white/10': c.id === active()?.id, 'cursor-pointer hover:bg-white/5': myRole() !== 'actor' || viewMode() !== 'requests' }"
                class="px-4 py-3 transition flex items-center gap-3"
              >
                <!-- Avatar -->
                <div
                  class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400"
                >
                  {{ c.name[0] | uppercase }}
                </div>

                <!-- Content -->
                <div
                  class="flex-1 min-w-0 cursor-pointer"
                  (click)="handleMobileItemClick(c)"
                >
                  <p class="truncate text-sm text-neutral-100">{{ c.name }}</p>
                  <p class="truncate text-xs text-neutral-400">{{ c.last }}</p>
                </div>

                <!-- Accept/Reject buttons for actor requests -->
                <div *ngIf="myRole() === 'actor' && viewMode() === 'requests'" class="flex gap-2">
                  <button
                    (click)="acceptRequest(c); mobileListOpen = false"
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 transition"
                    title="Accept"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button
                    (click)="rejectRequest(c); mobileListOpen = false"
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                    title="Reject"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Chat header -->
          <header
            class="hidden lg:flex items-center gap-3 px-5 py-4 border-b transition-colors duration-300"
            [ngClass]="{'border-purple-900/10': myRole() === 'actor', 'border-white/5': myRole() !== 'actor'}"
          >
            <div
              class="h-9 w-9 rounded-full flex items-center justify-center transition-colors duration-300"
              [ngClass]="{
                'bg-purple-950/10 text-purple-300/50': myRole() === 'actor',
                'bg-white/10 text-neutral-400': myRole() !== 'actor'
              }"
            >
              {{ active()?.name?.[0] | uppercase }}
            </div>
            <div class="text-sm flex-1">
              <div [ngClass]="{'text-purple-100/80': myRole() === 'actor', 'text-neutral-100': myRole() !== 'actor'}">
                {{ active()?.name || 'select a chat' }}
              </div>
              <div class="flex items-center gap-2"
                   [ngClass]="{'text-purple-300/50': myRole() === 'actor', 'text-neutral-500': myRole() !== 'actor'}">
                <!-- Online status indicator -->
                <span *ngIf="active() && counterpartLastSeen()" class="flex items-center gap-1.5">
                  <span
                    class="w-2 h-2 rounded-full"
                    [ngClass]="{
                      'bg-green-500 animate-pulse': counterpartOnline(),
                      'bg-gray-500': !counterpartOnline()
                    }"
                  ></span>
                  <span>{{ counterpartLastSeen() }}</span>
                </span>
                <!-- Typing indicator -->
                <span *ngIf="typingUsers() as typingUsers" [class.hidden]="!typingUsers.length" class="flex items-center text-fuchsia-300">
                  <span class="inline-flex space-x-1 mr-1">
                    <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                  </span>
                  typing...
                </span>
              </div>
            </div>

            <!-- Block/Unblock Menu -->
            <div *ngIf="active()" class="relative">
              <button
                type="button"
                (click)="showBlockMenu.set(!showBlockMenu())"
                class="p-2 rounded-full transition-colors"
                [ngClass]="{
                  'hover:bg-purple-950/10 text-purple-300/50': myRole() === 'actor',
                  'hover:bg-white/10 text-neutral-400': myRole() !== 'actor'
                }"
                title="More options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>

              <!-- Dropdown Menu -->
              @if (showBlockMenu()) {
                <div class="absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-10 border transition-colors duration-300"
                     [ngClass]="{
                       'bg-purple-950/10 border-purple-900/10': myRole() === 'actor',
                       'bg-neutral-900 border-white/10': myRole() !== 'actor'
                     }">
                  @if (!isCounterpartBlocked()) {
                    <button
                      type="button"
                      (click)="blockCurrentUser()"
                      class="w-full px-4 py-2 text-left text-sm transition rounded-lg flex items-center gap-2"
                      [ngClass]="{
                        'hover:bg-purple-950/10 text-red-400': myRole() === 'actor',
                        'hover:bg-white/5 text-red-400': myRole() !== 'actor'
                      }"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                      Block User
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="unblockCurrentUser()"
                      class="w-full px-4 py-2 text-left text-sm transition rounded-lg flex items-center gap-2"
                      [ngClass]="{
                        'hover:bg-purple-950/10 text-green-400': myRole() === 'actor',
                        'hover:bg-white/5 text-green-400': myRole() !== 'actor'
                      }"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      Unblock User
                    </button>
                  }
                </div>
              }
            </div>
          </header>

          <!-- Messages -->
          <div id="messagesContainer" class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-12 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            <!-- Loading state -->
            <app-loader [show]="loading()" [overlay]="false" message="Loading messages..."></app-loader>

            <ng-container *ngIf="active() && !loading(); else emptyStateTemplate">
              <div
                *ngFor="let m of filteredActiveMessages"
                class="flex"
                [class.justify-end]="m.from === 'me'"
              >
                <div
                  class="max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2 text-sm"
                  [ngClass]="{
                    'bg-white/10 text-neutral-100 rounded-tr-sm':
                      m.from === 'them',
                    'bg-fuchsia-600/20 text-fuchsia-100 rounded-tl-sm':
                      m.from === 'me'
                  }"
                >
                  <div>{{ m.text }}</div>
                  <div class="mt-1 text-[10px] text-neutral-400 flex items-center gap-1.5">
                    <span>{{ m.time }}</span>
                    <!-- Read receipt status for my messages -->
                    <span *ngIf="m.from === 'me' && m.status" class="flex items-center">
                      <!-- Sent: single checkmark -->
                      <svg *ngIf="m.status === 'sent'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <!-- Delivered: double checkmark (gray) -->
                      <svg *ngIf="m.status === 'delivered'" xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 28 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                        <polyline points="4 12 9 17 20 6"></polyline>
                        <polyline points="10 12 15 17 26 6"></polyline>
                      </svg>
                      <!-- Seen: double checkmark (blue) -->
                      <svg *ngIf="m.status === 'seen'" xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 28 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400">
                        <polyline points="4 12 9 17 20 6"></polyline>
                        <polyline points="10 12 15 17 26 6"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Typing indicator in messages area -->
              <div *ngIf="typingUsers() as typingUsers" [class.hidden]="!typingUsers.length" class="flex">
                <div class="bg-white/5 text-neutral-300 rounded-2xl px-4 py-2 text-sm">
                  <div class="flex items-center">
                    <span class="inline-flex space-x-1 mr-2">
                      <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                      <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                      <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                    </span>
                  </div>
                </div>
              </div>
            </ng-container>

            <ng-template #emptyStateTemplate>
              <!-- Initial loading state -->
              <div *ngIf="initialLoading()" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <app-loader [show]="true" [overlay]="false" message="Loading chat..."></app-loader>
              </div>

              <!-- When conversations exist but none selected -->
              <div *ngIf="!initialLoading() && conversations() && conversations().length > 0 && !active()" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>

              <!-- Producer: No conversations yet -->
              <div *ngIf="!initialLoading() && myRole() === 'producer' && conversations() && conversations().length === 0 && rejectedChats().length === 0" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>No conversations yet</p>
                  <p class="text-xs text-neutral-500">Use the search above to find conversations</p>
                </div>
              </div>

              <!-- Producer: Rejected chats -->
              <div *ngIf="!initialLoading() && myRole() === 'producer' && rejectedChats().length > 0 && !active()" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>You can message these actors:</p>
                  <div class="flex flex-col gap-2 w-full max-w-xs">
                    <ng-container *ngFor="let rejectedChat of rejectedChats()">
                      <button
                        (click)="startChatWithActor(rejectedChat.actorId)"
                        class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-200 transition flex items-center gap-2"
                      >
                        <div class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400">{{ getActorInitial(rejectedChat.actorId) }}</div>
                        <span>{{ getActorName(rejectedChat.actorId) }}</span>
                      </button>
                    </ng-container>
                  </div>
                </div>
              </div>

              <!-- Actor: Chat tab with no conversations -->
              <div *ngIf="!initialLoading() && myRole() === 'actor' && viewMode() === 'chat' && conversations() && conversations().length === 0" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>No messages yet</p>
                  <p class="text-xs text-neutral-500">Producers will reach out to you</p>
                </div>
              </div>

              <!-- Actor: Requests loading state -->
              <div *ngIf="requestsLoading() && myRole() === 'actor' && viewMode() === 'requests'" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <app-loader [show]="true" [overlay]="false" message="Loading requests..."></app-loader>
              </div>

              <!-- Actor: Requests tab with no requests -->
              <div *ngIf="!requestsLoading() && myRole() === 'actor' && viewMode() === 'requests' && conversations() && conversations().length === 0" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>No requests yet</p>
                  <p class="text-xs text-neutral-500">New chat requests will appear here</p>
                </div>
              </div>

              <!-- When conversations is undefined but not in initial loading -->
              <div *ngIf="!initialLoading() && !conversations()" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>Loading conversations...</p>
                </div>
              </div>
            </ng-template>
          </div>

          <!-- Blocked User Warning -->
          <div
            *ngIf="active() && isCounterpartBlocked()"
            class="p-3 sm:p-4 pt-6 mb-4 border-t transition-colors duration-300 flex items-center justify-center shrink-0 rounded-b-2xl"
            [ngClass]="{
              'border-purple-900/10 bg-purple-950/10': myRole() === 'actor',
              'border-white/5 bg-neutral-900/60': myRole() !== 'actor'
            }"
          >
            <div class="text-red-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
              <span>You have blocked this user. Unblock to send messages.</span>
            </div>
          </div>

          <!-- Rejected by Actor Warning -->
          <div
            *ngIf="active() && !isCounterpartBlocked() && myRole() === 'producer' && isRejectedByActor()"
            class="p-3 sm:p-4 pt-6 mb-4 border-t border-white/5 flex items-center justify-center shrink-0 bg-neutral-900/60 rounded-b-2xl"
          >
            <div class="text-red-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>You cannot message this actor</span>
            </div>
          </div>

          <!-- Composer -->
          <form
            (ngSubmit)="send()"
            class="p-3 sm:p-4 pt-6 border-t border-white/5 flex items-center gap-2 sm:gap-3 shrink-0 bg-neutral-900/60 rounded-b-2xl"
            *ngIf="active() && !isCounterpartBlocked() && ((myRole() !== 'actor' && !isRejectedByActor()) || active()!.actorAccepted)"
          >
            <input
              id="message-draft"
              [(ngModel)]="draft"
              name="draft"
              placeholder="type a message"
              autocomplete="off"
              (input)="onInputChange()"
              class="flex-1 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-fuchsia-500/30 transition"
            />
            <button
              type="submit"
              class="rounded-full px-4 py-2 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 text-neutral-100 transition disabled:opacity-50 flex items-center justify-center min-w-[70px]"
              [disabled]="!draft.trim() || isSending"
            >
              <span *ngIf="!isSending">send</span>
              <span *ngIf="isSending" class="flex items-center gap-1">
                <span class="inline-flex space-x-1">
                  <span class="w-1 h-1 bg-neutral-300 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-1 h-1 bg-neutral-300 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-1 h-1 bg-neutral-300 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </span>
              </span>
            </button>
          </form>
        </section>
      </div>
    </div>
  `,
  styles: [`
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
      background: radial-gradient(ellipse at top left, rgba(147, 51, 234, 0.02) 0%, transparent 35%),
                  radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.015) 0%, transparent 35%);
      pointer-events: none;
      z-index: 0;
    }
    .actor-theme {
      position: relative;
    }
  `],
})
export class ChatComponent implements OnInit, OnDestroy {
  private chat = inject(ChatService);
  private auth = inject(AuthService);
  private actor = inject(ActorService);
  private user = inject(UserService);
  private presence = inject(PresenceService);
  private blockService = inject(BlockService);

  // Signals for reactive state
  conversations = signal<Conversation[]>([]);
  active = signal<Conversation | null>(null);
  draft = '';
  mobileListOpen = false;
  loading = signal(false);
  initialLoading = signal(true);
  requestsLoading = signal(true);

  // Block functionality
  isCounterpartBlocked = signal(false);
  showBlockMenu = signal(false);

  meUid: string | null = null;

  // Check block status when conversation is selected
  private async checkBlockStatus() {
    const activeConv = this.active();
    if (!activeConv || !this.meUid) {
      this.isCounterpartBlocked.set(false);
      return;
    }

    const counterpartId = this.counterpartByRoom.get(activeConv.id);
    if (!counterpartId) {
      this.isCounterpartBlocked.set(false);
      return;
    }

    try {
      const isBlocked = await this.blockService.isUserBlockedAsync(this.meUid, counterpartId);
      this.isCounterpartBlocked.set(isBlocked);
    } catch (error) {
      console.error('Error checking block status:', error);
      this.isCounterpartBlocked.set(false);
    }
  }

  // Block current user
  async blockCurrentUser() {
    const activeConv = this.active();
    if (!activeConv || !this.meUid) return;

    const counterpartId = this.counterpartByRoom.get(activeConv.id);
    if (!counterpartId) return;

    try {
      await this.blockService.blockUser(this.meUid, counterpartId);
      this.isCounterpartBlocked.set(true);
      this.showBlockMenu.set(false);
      alert('User has been blocked');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  }

  // Unblock current user
  async unblockCurrentUser() {
    const activeConv = this.active();
    if (!activeConv || !this.meUid) return;

    const counterpartId = this.counterpartByRoom.get(activeConv.id);
    if (!counterpartId) return;

    try {
      await this.blockService.unblockUser(this.meUid, counterpartId);
      this.isCounterpartBlocked.set(false);
      alert('User has been unblocked');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  }
  myRole = signal<UserRole>('user');
  private roomsSub = new Subscription();
  private msgsSub = new Subscription();
  private typingSubscription = new Subscription();
  private counterpartByRoom = new Map<string, string>();
  private counterpartNames = new Map<string, string>();
  private onlineStatusSub = new Subscription();

  // Universal search
  searchControl = new FormControl('');
  showSearchResults = false;
  searchResults = signal<{
    conversations: Conversation[];
    messageMatches: Map<string, number>;
  }>({ conversations: [], messageMatches: new Map() });
  isSearching = signal(false);

  user$ = this.user

  // Actor: controls which list to show - using signal
  viewMode = signal<'chat' | 'requests'>('chat');

  // Stream-driven state
  private viewMode$ = new BehaviorSubject<'chat' | 'requests'>('chat');
  private readonly LAST_ROOM_KEY = 'chat:lastRoomId';
  private activeRoomId$ = new BehaviorSubject<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem('chat:lastRoomId') : null);

  // Streams
  myRole$?: Observable<UserRole>;
  rooms$?: Observable<(ChatRoom & { id: string })[]>;
  conversations$?: Observable<Conversation[]>;
  active$?: Observable<Conversation | null>;
  messages$?: Observable<Message[]>;

  // Typing indicators
  private typingHandler?: (isTyping: boolean) => void;
  typingUsers$?: Observable<string[]>;
  typingUsers = signal<string[]>([]);
  isTyping = false;
  isSending = false;

  // Online status
  counterpartOnline = signal<boolean>(false);
  counterpartLastSeen = signal<string>('');  // Start empty, will load

  // Unread counts - signals
  requestsCount$?: Observable<number>;
  totalUnreadCount$?: Observable<number>;
  requestsCount = signal<number>(0);
  totalUnreadCount = signal<number>(0);

  // Rejected chats (for producers) - signal
  rejectedChats$?: Observable<(ChatRoom & { id: string })[]>;
  rejectedChats = signal<(ChatRoom & { id: string })[]>([]);

  // Actor message search
  messageSearch = new FormControl('');
  get filteredActiveMessages(): Message[] {
    const q = (this.messageSearch.value || '').toString().trim().toLowerCase();
    const list = this.active()?.messages ?? [];
    if (!q) return list;
    return list.filter(m => (m.text || '').toLowerCase().includes(q));
  }

  async ngOnInit() {
    const me = this.auth.getCurrentUser();
    if (!me) {
      // not logged in; keep UI empty
      return;
    }
    this.meUid = me.uid;

    // Role stream`
    this.myRole$ = this.user.observeUser(me.uid).pipe(
      map(u => (u?.currentRole as UserRole) || 'user'),
      shareReplay(1)
    );

    // Mirror role to signal
    this.roomsSub.add(this.myRole$.subscribe(r => this.myRole.set(r)));

    // Total unread count for accepted chats (for chat tab)
    this.totalUnreadCount$ = this.myRole$.pipe(
      switchMap(role => this.chat.getTotalUnreadCount(this.meUid!, role)),
      tap(count => this.totalUnreadCount.set(count)),
      shareReplay(1)
    );
    this.roomsSub.add(this.totalUnreadCount$.subscribe());

    // For actors: count of producer-initiated threads (requests)
    this.requestsCount$ = this.myRole$.pipe(
      filter(role => role === 'actor'),
      switchMap(() => this.chat.getChatRequestsCount(this.meUid!)),
      tap(count => {
        this.requestsCount.set(count);
        // Set requestsLoading to false once we have requests data
        this.requestsLoading.set(false);
      }),
      shareReplay(1)
    );

    // Subscribe to requestsCount$ to ensure it's initialized
    this.roomsSub.add(this.requestsCount$?.subscribe());

    // For producers: observe rejected chats - will be set up after role is determined
    this.roomsSub.add(this.myRole$.subscribe(role => {
      if (role === 'producer' && this.meUid) {
        this.rejectedChats$ = this.chat.observeRejectedChatsForProducer(this.meUid);
        this.roomsSub.add(
          this.rejectedChats$.subscribe(rejectedChats => {
            this.rejectedChats.set(rejectedChats);
          })
        );
      }
    }));

    // Skip cached rooms processing to avoid showing user IDs
    // The conversations$ observable will load proper data with names

    // Universal search: debounce search input
    this.roomsSub.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isSearching.set(true))
      ).subscribe(term => {
        this.performUniversalSearch(term || '');
      })
    );

    // Rooms stream depending on role and view mode
    this.rooms$ = combineLatest([this.myRole$, this.viewMode$]).pipe(
      switchMap(([role, mode]) => {
        if (role === 'actor' && mode === 'requests') {
          return this.chat.observeRequestsForActor(this.meUid!);
        }
        return this.chat.observeRoomsForUser(this.meUid!, role);
      }),
      shareReplay(1)
    );

    // Conversations stream with counterpart names
    this.conversations$ = this.rooms$!.pipe(
      switchMap((rooms) => {
        if (!rooms.length) return of([] as Conversation[]);
        const lookups = rooms.map((r) => {
          const counterpartId = this.getCounterpartId(r);
          this.counterpartByRoom.set(r.id!, counterpartId);
          return this.user.observeUser(counterpartId).pipe(
            take(1),
            map(u => ({
              id: r.id!,
              name: (u?.name as string) || counterpartId,
              last: r.lastMessage?.text || '',
              unreadCount: r.unreadCount,
              actorAccepted: r.actorAccepted,
              actorRejected: r.actorRejected,
              messages: [] as Message[]
            }))
          );
        });
        return combineLatest(lookups);
      }),
      shareReplay(1)
    );

    // Mirror to conversations signal
    this.roomsSub.add(this.conversations$!.subscribe(cs => {
      this.conversations.set(cs);
      // Set initialLoading to false once we have conversations data
      this.initialLoading.set(false);
    }));

    // Active conversation stream: restore last or pick first
    this.active$ = combineLatest([
      this.conversations$!,
      this.activeRoomId$,
      this.viewMode$
    ]).pipe(
      map(([cs, id, mode]) => {
        if (!cs.length) return null;
        // When no active ID, pick first conversation
        if (!id) return cs[0];
        // Try to find the requested conversation
        const found = cs.find(c => c.id === id);
        // If not found, pick first (likely switched modes)
        return found ?? cs[0];
      }),
      // Only prevent duplicate emissions of the exact same conversation
      distinctUntilChanged((prev, curr) => {
        // If both null, skip
        if (!prev && !curr) return true;
        // If one is null, don't skip
        if (!prev || !curr) return false;
        // Only skip if same ID
        return prev.id === curr.id;
      }),
      tap((c: Conversation | null) => {
        if (!c) return;
        try { localStorage.setItem(this.LAST_ROOM_KEY, c.id); } catch {}
      }),
      shareReplay(1)
    );

    // Mirror to active signal
    this.roomsSub.add(this.active$!.subscribe(c => this.active.set(c)));

    // Messages stream based on active - optimized for instant loading
    this.messages$ = this.active$!.pipe(
      filter((c): c is Conversation => !!c),
      switchMap((c: Conversation) => {
        // Check for cached messages first to show immediately
        const cachedMessages = this.chat.getCachedMessages(c.id);
        if (cachedMessages && cachedMessages.length > 0) {
          // Process cached messages immediately
          setTimeout(() => {
            this.processMessages(cachedMessages.map(m => {
              const from: 'me' | 'them' = m.senderId === this.meUid! ? 'me' : 'them';
              const status = from === 'me' ? this.getMessageStatus(m) : undefined;
              return {
                id: m.id!,
                from,
                text: m.text,
                time: this.formatTime(m.timestamp),
                status,
              } as Message;
            }));
            // Scroll to bottom immediately
            setTimeout(() => this.scrollToBottom(), 10);
          }, 0);
        }

        // Return the real-time updates from Firestore
        return this.chat.observeMessages(c.id);
      }),
      tap(async (msgs: (ChatMessage & { id: string })[]) => {
        // Mark messages as delivered when they arrive
        const activeConv = this.active();
        if (activeConv && this.meUid) {
          await this.chat.markMessagesAsDelivered(activeConv.id, this.meUid);
        }
      }),
      map((msgs: (ChatMessage & { id: string })[]) => msgs.map((m: ChatMessage & { id: string }) => {
        const from: 'me' | 'them' = m.senderId === this.meUid! ? 'me' : 'them';
        // Calculate status for messages sent by me
        const status = from === 'me' ? this.getMessageStatus(m) : undefined;
        return {
          id: m.id!,
          from,
          text: m.text,
          time: this.formatTime(m.timestamp),
          status,
        } as Message;
      })),
      shareReplay(1)
    );

    // Process messages and update active conversation
    this.msgsSub.add(this.messages$!.subscribe(ms => {
      this.processMessages(ms);
    }));

    // Setup typing users signal
    this.typingUsers$ = this.active$.pipe(
      switchMap(activeConv => {
        if (!activeConv) return of([]);
        return this.chat.observeTypingUsers(activeConv.id, this.meUid!);
      }),
      tap(users => this.typingUsers.set(users))
    );
    this.roomsSub.add(this.typingUsers$.subscribe());

    // Setup online status tracking for active conversation
    this.roomsSub.add(this.active$.pipe(
      switchMap(activeConv => {
        if (!activeConv) {
          this.counterpartOnline.set(false);
          this.counterpartLastSeen.set('');
          return of(null);
        }
        // Get counterpart ID from the room
        const counterpartId = this.counterpartByRoom.get(activeConv.id);
        if (!counterpartId) {
          this.counterpartOnline.set(false);
          this.counterpartLastSeen.set('');
          return of(null);
        }
        // Show loading state while fetching
        this.counterpartLastSeen.set('loading...');
        // Observe online status and last seen time
        return combineLatest([
          this.presence.observeUserOnlineStatus(counterpartId),
          this.presence.getLastSeenTime(counterpartId)
        ]).pipe(
          tap(([isOnline, lastSeen]) => {
            this.counterpartOnline.set(isOnline);
            // Pass isOnline flag to formatLastSeen for accurate status
            this.counterpartLastSeen.set(this.presence.formatLastSeen(lastSeen, isOnline));
          })
        );
      })
    ).subscribe());
  }
  // Process cached rooms to show immediately
  private processCachedRooms(rooms: (ChatRoom & { id: string })[]) {
    // Disabled to prevent showing user IDs instead of names on reload
    // The conversations$ observable will handle proper loading with user names
    return;
  }

  // Process messages and update active conversation
  private processMessages(ms: Message[]) {
    const activeConv = this.active();
    if (activeConv) {
      const prevLength = activeConv.messages?.length || 0;
      activeConv.messages = ms;
      // Update the signal with the modified conversation
      this.active.set({...activeConv});

      // If we received new messages, scroll to bottom
      if (ms.length > prevLength) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    }
  }

  ngOnDestroy(): void {
    this.roomsSub.unsubscribe();
    this.msgsSub.unsubscribe();
    this.typingSubscription.unsubscribe();
    this.onlineStatusSub.unsubscribe();
  }

  // Stream-based open with instant loading
  open(c: Conversation) {
    // Set active conversation immediately
    this.active.set(c);
    this.activeRoomId$.next(c.id);

    // Check if counterpart is blocked
    this.checkBlockStatus();

    // Mark messages as read when opening a conversation
    if (this.meUid) {
      // Clear unread count locally immediately for instant UI update
      if (c.unreadCount && c.unreadCount[this.meUid]) {
        c.unreadCount[this.meUid] = 0;
        
        // Also update in the conversations list
        const convos = this.conversations();
        if (convos) {
          const convoIndex = convos.findIndex(conv => conv.id === c.id);
          if (convoIndex !== -1) {
            const updatedConvos = [...convos];
            updatedConvos[convoIndex] = {...updatedConvos[convoIndex], unreadCount: {...c.unreadCount}};
            this.conversations.set(updatedConvos);
          }
        }
      }
      
      // Mark messages as read in the database
      this.chat.markMessagesAsRead(c.id, this.meUid);

      // Force refresh of unread counts to update UI immediately
      // Re-initialize the observable to force a fresh query
      this.totalUnreadCount$ = this.chat.getTotalUnreadCount(this.meUid, this.myRole());
      this.totalUnreadCount$.pipe(take(1)).subscribe();

      // For actors, also refresh request counts
      if (this.myRole() === 'actor' && this.requestsCount$) {
        this.requestsCount$.pipe(take(1)).subscribe();
      }
    }

    // Clear draft if this is a rejected conversation for a producer
    if (this.myRole() === 'producer' && c.actorRejected) {
      this.draft = '';
    }

    // Check for cached messages first to show immediately
    const cachedMessages = this.chat.getCachedMessages(c.id);
    if (cachedMessages && cachedMessages.length > 0) {
      // Use cached messages immediately
      this.loading.set(false);
      this.processMessages(cachedMessages.map(m => {
        const from: 'me' | 'them' = m.senderId === this.meUid! ? 'me' : 'them';
        return {
          id: m.id!,
          from,
          text: m.text,
          time: this.formatTime(m.timestamp),
        } as Message;
      }));
      // Scroll to bottom immediately
      setTimeout(() => this.scrollToBottom(), 10);
    } else {
      // Only show loading if we don't have cached messages
      this.loading.set(true);
      // Set a very short timeout to allow UI to update
      setTimeout(() => {
        this.loading.set(false);
        setTimeout(() => this.scrollToBottom(), 10);
      }, 100); // Reduced from 500ms to 100ms
    }

    // Mark as read when opening
    if (this.meUid) {
      this.chat.markMessagesAsRead(c.id, this.meUid);
    }

    // Setup typing indicator for this room
    this.setupTypingIndicator(c.id);

    // Save last opened conversation
    try { localStorage.setItem(this.LAST_ROOM_KEY, c.id); } catch {}
  }

  // Scroll to bottom of messages container
  scrollToBottom() {
    const container = document.querySelector('#messagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Setup typing indicator for the active conversation
  private setupTypingIndicator(roomId: string) {
    // Clean up previous subscription
    this.typingSubscription.unsubscribe();
    this.typingSubscription = new Subscription();

    // Create typing handler for this room
    this.typingHandler = this.chat.createTypingIndicator(roomId, this.meUid!);

    // Observe typing users in this room (excluding self)
    this.typingUsers$ = this.chat.observeTypingUsers(roomId, this.meUid!);

    // Subscribe to typing users to update UI
    if (this.typingUsers$) {
      this.typingSubscription.add(this.typingUsers$.subscribe());
    }
  }

  // Handle input for typing indicator
  onInputChange() {
    if (!this.typingHandler || !this.active()) return;

    // Set typing state to true
    this.isTyping = true;
    this.typingHandler(true);
  }

  setViewMode(mode: 'chat' | 'requests') {
    if (this.viewMode() === mode) return;
    
    // Clear the active room ID so the stream picks the first conversation from new mode
    this.activeRoomId$.next(null);
    
    // Update view mode - the active$ stream will handle selecting first conversation
    this.viewMode.set(mode);
    this.viewMode$.next(mode);
  }

  async send() {
    const txt = this.draft.trim();
    if (!txt || !this.active() || !this.meUid || this.isSending) return;

    // Prevent sending if the conversation has been rejected (for producers)
    if (this.myRole() === 'producer' && this.isRejectedByActor()) {
      this.draft = '';
      return;
    }

    const activeConv = this.active();
    if (!activeConv) return;
    const roomId = activeConv.id;
    const receiverId = this.counterpartByRoom.get(roomId) || '';

    // Clear draft immediately for better UX
    const draftCopy = txt;
    this.draft = '';

    // Add optimistic message to UI immediately
    const optimisticId = `temp-${Date.now()}`;
    const now = new Date();
    const optimisticMessage: Message = {
      id: optimisticId,
      from: 'me',
      text: draftCopy,
      time: this.formatTime({ toDate: () => now }),
      status: 'sent', // Optimistic status
    };

    // Add to active conversation
    const currentActive = this.active();
    if (currentActive && currentActive.messages) {
      currentActive.messages = [...currentActive.messages, optimisticMessage];
      this.active.set({...currentActive});
      // Scroll to bottom immediately
      setTimeout(() => this.scrollToBottom(), 10);
    }

    // Reset typing indicator
    if (this.typingHandler) {
      this.isTyping = false;
      this.typingHandler(false);
    }

    // Set sending state
    this.isSending = true;

    try {
      // Actually send the message
      await this.chat.sendMessage({
        roomId,
        senderId: this.meUid,
        receiverId,
        text: draftCopy,
      });

      // Message sent successfully, no need to do anything as Firestore will update the UI
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error - could show a toast notification here

      // If sending fails, put the message back in the draft
      this.draft = draftCopy;
    } finally {
      this.isSending = false;
    }
  }

  private formatTime(ts: any): string {
    try {
      const d = ('toDate' in ts ? ts.toDate() : new Date()) as Date;
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return '';
    }
  }

  private getMessageStatus(message: ChatMessage): 'sent' | 'delivered' | 'seen' {
    // Check if message has been read
    const hasReadAt = message.readAt && message.readAt !== null;
    const hasDeliveredAt = message.deliveredAt && message.deliveredAt !== null;
    
    // Prioritize readAt timestamp for "seen" status
    // If readAt exists, show blue ticks (seen)
    if (hasReadAt) {
      return 'seen';
    } else if (hasDeliveredAt) {
      return 'delivered';
    } else {
      return 'sent';
    }
  }

  private getCounterpartId(r: ChatRoom): string {
    if (!this.meUid) return r.participants[0];
    return r.participants.find((p) => p !== this.meUid) || r.participants[0];
  }

  // Universal search handlers
  openSearchResults() { 
    this.showSearchResults = true; 
  }
  
  closeSearchResultsLater() { 
    setTimeout(() => {
      this.showSearchResults = false;
      this.isSearching.set(false);
    }, 200); 
  }
  
  async performUniversalSearch(term: string) {
    const searchTerm = term.trim().toLowerCase();
    
    if (!searchTerm) {
      this.searchResults.set({ conversations: [], messageMatches: new Map() });
      this.isSearching.set(false);
      return;
    }

    const allConversations = this.conversations();
    
    // Search by person name
    const nameMatches = allConversations.filter(c => 
      c.name.toLowerCase().includes(searchTerm)
    );

    // Search by message content
    const roomIds = allConversations.map(c => c.id);
    const messageResults = await this.chat.searchMessagesInRooms(roomIds, searchTerm);
    
    // Combine results: conversations with name matches or message matches
    const messageMatchedConvos = allConversations.filter(c => 
      messageResults.has(c.id)
    );
    
    // Merge and deduplicate
    const allMatches = [...nameMatches];
    messageMatchedConvos.forEach(c => {
      if (!allMatches.find(existing => existing.id === c.id)) {
        allMatches.push(c);
      }
    });

    // Create a map of conversation ID to message count
    const messageMatchCounts = new Map<string, number>();
    messageResults.forEach((messages, roomId) => {
      messageMatchCounts.set(roomId, messages.length);
    });

    this.searchResults.set({ 
      conversations: allMatches,
      messageMatches: messageMatchCounts
    });
    this.isSearching.set(false);
  }

  selectSearchResult(conversation: Conversation) {
    this.showSearchResults = false;
    this.searchControl.setValue('', { emitEvent: false });
    this.searchResults.set({ conversations: [], messageMatches: new Map() });
    this.open(conversation);
  }

  // Accept a chat request (for actors)
  async acceptRequest(c: Conversation) {
    if (!this.meUid) return;
    try {
      // Accept the chat request
      await this.chat.acceptChatRequest(c.id, this.meUid);

      // Update the conversation object to reflect acceptance
      c.actorAccepted = true;

      // Update the active conversation if it's the same one
      const activeConv = this.active();
      if (activeConv && activeConv.id === c.id) {
        this.active.set({...activeConv, actorAccepted: true});
      }

      // Switch to chat view mode first
      this.setViewMode('chat');

      // Open the conversation after accepting
      this.open(c);

      // Force UI update by creating a new reference
      const convos = this.conversations();
      if (convos) {
        const updatedConversations = convos.map(conv => {
          if (conv.id === c.id) {
            return {...conv, actorAccepted: true};
          }
          return conv;
        });
        this.conversations.set(updatedConversations);
      }

      // Refresh the conversations list to update UI
      this.refreshConversations();
    } catch (error) {
      console.error('Error accepting chat request:', error);
    }
  }

  // Reject a chat request (for actors)
  async rejectRequest(c: Conversation) {
    if (!this.meUid) return;
    try {
      await this.chat.rejectChatRequest(c.id, this.meUid);
      // Remove from the conversations list
      const convos = this.conversations();
      this.conversations.set(convos.filter(conv => conv.id !== c.id));
      // If this was the active conversation, clear it
      const activeConv = this.active();
      if (activeConv?.id === c.id) {
        this.active.set(null);
      }
    } catch (error) {
      console.error('Error rejecting chat request:', error);
    }
  }

  // Handle click on mobile conversation item
  handleMobileItemClick(c: Conversation) {
    // Always allow opening conversations to view them
    // The accept/reject buttons have their own click handlers
    this.open(c);
    this.mobileListOpen = false;
  }

  // Handle click on desktop conversation item
  handleDesktopItemClick(c: Conversation) {
    // Always allow opening conversations to view them
    // The accept/reject buttons have their own click handlers
    this.open(c);
  }

  openDefaultConversation() {
    const convos = this.conversations();
    if (convos.length) {
      this.open(convos[0]);
      return;
    }
    // Focus on search input if no conversations exist
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  }

  // Helper method to get actor initial for display
  getActorInitial(actorId: string): string {
    // Try to get from cached names first
    const cachedName = this.getActorName(actorId);
    if (cachedName && cachedName !== 'Unknown') {
      return cachedName[0].toUpperCase();
    }
    // Default initial if name not found
    return 'A';
  }

  // Helper method to get actor name
  getActorName(actorId: string): string {
    // Check if we have the actor name in our cache
    const cachedName = this.counterpartNames.get(actorId);
    if (cachedName) {
      return cachedName;
    }

    // If not in cache, fetch it and store for future use
    this.user.observeUser(actorId).pipe(take(1)).subscribe(user => {
      if (user) {
        const name = user.name || user.email?.split('@')[0] || 'Unknown';
        this.counterpartNames.set(actorId, name);
      }
    });

    // Return a placeholder until we get the real name
    return 'Actor';
  }

  // Check if the current conversation has been rejected by the actor
  isRejectedByActor(): boolean {
    const activeConv = this.active();
    if (!activeConv) return false;
    return activeConv.actorRejected === true;
  }

  // Start a new chat with an actor (for producers, after rejection)
  async startChatWithActor(actorId: string) {
    if (!this.meUid || this.myRole() !== 'producer') return;

    // Create a chat room without sending an initial message
    const roomId = await this.chat.producerStartChat(actorId, this.meUid);

    // Wait a moment for the room to propagate
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find the conversation and open it
    const convo = this.conversations().find(c => c.id === roomId);
    if (convo) {
      this.open(convo);
      // Set focus on the draft input
      setTimeout(() => {
        const draftInput = document.getElementById('message-draft');
        if (draftInput) {
          draftInput.focus();
        }
      }, 100);
    } else {
      // If conversation not found in the list, refresh conversations
      this.refreshConversations();
      // Try to find it again after a short delay
      setTimeout(() => {
        const newConvo = this.conversations().find(c => c.id === roomId);
        if (newConvo) {
          this.open(newConvo);
        }
      }, 500);
    }
  }

  // Refresh conversations list
  refreshConversations() {
    // Force a refresh of the conversations list
    if (this.rooms$) {
      // Take the latest value from rooms$ and process it
      this.rooms$.pipe(take(1)).subscribe(rooms => {
        // First, create basic conversations with IDs
        const tempConversations: Conversation[] = rooms.map(r => {
          const counterpartId = this.getCounterpartId(r);
          this.counterpartByRoom.set(r.id!, counterpartId);

          return {
            id: r.id!,
            name: counterpartId, // Temporary name, will be updated
            last: r.lastMessage?.text || '',
            actorAccepted: r.actorAccepted,
            actorRejected: r.actorRejected,
            unreadCount: r.unreadCount
          };
        });

        // Now fetch user names for each counterpart
        const lookups = tempConversations.map(c => {
          const counterpartId = this.counterpartByRoom.get(c.id) || '';
          return this.user.observeUser(counterpartId).pipe(
            take(1),
            map(u => ({
              id: c.id,
              name: u?.name || u?.email?.split('@')[0] || 'Unknown',
            }))
          );
        });

        // Combine all lookups
        if (lookups.length) {
          combineLatest(lookups).pipe(take(1)).subscribe(nameUpdates => {
            // Update names in conversations
            nameUpdates.forEach(update => {
              const convo = tempConversations.find(c => c.id === update.id);
              if (convo) {
                convo.name = update.name;
              }
            });

            // Update the conversations signal
            this.conversations.set(tempConversations);
          });
        } else {
          // No lookups needed, just update the conversations signal
          this.conversations.set(tempConversations);
        }
      });
    }
  }
}
