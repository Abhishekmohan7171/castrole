import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, debounceTime, distinctUntilChanged, filter, map, of, shareReplay, startWith, switchMap, take, tap } from 'rxjs';
import { ChatService, ChatMessage, ChatRoom, UserRole } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { ActorService } from '../services/actor.service';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { ProducersService } from '../services/producers.service';
import { UserService } from '../services/user.service';
import { LoaderComponent } from '../common-components/loader/loader.component';
type Message = { id: string; from: 'me' | 'them'; text: string; time: string };
type Conversation = {
  id: string;
  name: string;
  last: string;
  messages?: Message[];
  unreadCount?: Record<string, number>;
  actorAccepted?: boolean;
  actorRejected?: boolean;
};

@Component({
  selector: 'app-discover-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent],
  template: `
    <div class="h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] overflow-hidden text-neutral-200 flex flex-col border-b border-neutral-800 mb-6">
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-full flex-1 overflow-hidden">
        <!-- Conversations (sidebar) -->
        <aside
          class="rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 border border-white/5 overflow-hidden hidden lg:flex lg:flex-col h-full"
        >
          <div class="p-4 border-b border-white/5 relative">
            @if (myRole === 'producer') {
              <input
                type="search"
                [formControl]="searchControl"
                placeholder="search actors"
                (focus)="openActorDropdown()"
                (blur)="closeActorDropdownLater()"
                (input)="onSearch($any($event.target).value)"
                class="w-full bg-neutral-900 text-neutral-200 placeholder-neutral-500 rounded-full px-4 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-fuchsia-500/30 transition"
              />
              @if (showActorDropdown) {
                <div class="absolute left-4 right-4 mt-2 z-10 max-h-72 overflow-auto rounded-xl bg-neutral-900 ring-1 ring-white/10 border border-white/5 shadow-xl">
                  @for (actor of (filteredActors$ | async) ?? []; track actor.uid) {
                    <button type="button" (mousedown)="$event.preventDefault()" (click)="startChatWith(actor)"
                            class="w-full text-left px-3 py-2 hover:bg-white/5 transition flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400">{{ actor.name[0] | uppercase }}</div>
                      <div class="flex-1 min-w-0">
                        <p class="truncate text-sm text-neutral-100">{{ actor.name || actor.uid }}</p>
                        <p class="truncate text-xs text-neutral-400">{{ actor.location }}</p>
                      </div>
                    </button>
                  }
                  @if (((filteredActors$ | async) ?? []).length === 0) {
                    <div class="px-3 py-3 text-sm text-neutral-400">No actors found</div>
                  }
                </div>
              }
            } @else if (myRole === 'actor') {
              <div class="flex items-center gap-3">
                <button type="button"
                        (click)="setViewMode('chat')"
                        [ngClass]="{ 'bg-fuchsia-600/20': viewMode === 'chat' }"
                        class="px-4 py-1.5 rounded-full text-sm ring-1 ring-white/10 text-neutral-200 hover:bg-white/10 transition relative">
                  chat
                  <ng-container *ngIf="totalUnreadCount$ | async as unreadCount">
                    <span
                      *ngIf="unreadCount > 0"
                      class="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-fuchsia-600 text-white text-xs animate-pulse">
                      {{ unreadCount }}
                    </span>
                  </ng-container>
                </button>
                <button type="button"
                        (click)="setViewMode('requests')"
                        [ngClass]="{ 'bg-fuchsia-600/20': viewMode === 'requests' }"
                        class="px-4 py-1.5 rounded-full text-sm ring-1 ring-white/10 text-neutral-200 hover:bg-white/10 transition relative">
                  requests
                  <ng-container *ngIf="requestsCount$ | async as reqCount">
                    <span
                      *ngIf="reqCount > 0"
                      class="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-fuchsia-600 text-white text-xs animate-pulse">
                      {{ reqCount }}
                    </span>
                  </ng-container>
                </button>
              </div>
            }
          </div>
          <ul class="divide-y divide-white/5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            <!-- Regular chat conversation item -->
            <li
              *ngFor="let c of conversations"
              [ngClass]="{ 'bg-white/10': c.id === active?.id, 'cursor-pointer hover:bg-white/5': myRole !== 'actor' || viewMode !== 'requests' }"
              class="px-4 py-3 transition flex items-center gap-3"
            >
              <!-- Avatar -->
              <div
                class="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-neutral-400"
              >
                {{ c.name[0] | uppercase }}
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0" [class.cursor-pointer]="myRole !== 'actor' || viewMode !== 'requests'" (click)="handleDesktopItemClick(c)">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm text-neutral-100">{{ c.name }}</p>
                  <ng-container *ngIf="c.unreadCount && meUid">
                    <span
                      *ngIf="c.unreadCount[meUid] > 0"
                      class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-600 text-white animate-pulse"
                      >{{ c.unreadCount[meUid] }}</span
                    >
                  </ng-container>
                </div>
                <p class="truncate text-xs text-neutral-400">{{ c.last }}</p>
              </div>
              
              <!-- Accept/Reject buttons for actor requests -->
              <div *ngIf="myRole === 'actor' && viewMode === 'requests'" class="flex gap-2">
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
          class="rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 border border-white/5 flex flex-col h-full overflow-hidden pb-4"
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
              {{ active?.name || 'select a chat' }}
            </div>
          </div>

          <!-- Mobile conversations drawer -->
          <div *ngIf="mobileListOpen" class="lg:hidden border-b border-white/5">
            <ul class="max-h-[40vh] overflow-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              <li
                *ngFor="let c of conversations"
                [ngClass]="{ 'bg-white/10': c.id === active?.id, 'cursor-pointer hover:bg-white/5': myRole !== 'actor' || viewMode !== 'requests' }"
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
                  class="flex-1 min-w-0" 
                  [class.cursor-pointer]="myRole !== 'actor' || viewMode !== 'requests'" 
                  (click)="handleMobileItemClick(c)"
                >
                  <p class="truncate text-sm text-neutral-100">{{ c.name }}</p>
                  <p class="truncate text-xs text-neutral-400">{{ c.last }}</p>
                </div>
                
                <!-- Accept/Reject buttons for actor requests -->
                <div *ngIf="myRole === 'actor' && viewMode === 'requests'" class="flex gap-2">
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
            class="hidden lg:flex items-center gap-3 px-5 py-4 border-b border-white/5"
          >
            <div
              class="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-neutral-400"
            >
              {{ active?.name?.[0] | uppercase }}
            </div>
            <div class="text-sm">
              <div class="text-neutral-100">
                {{ active?.name || 'select a chat' }}
              </div>
              <div class="text-neutral-500 flex items-center">
                <span *ngIf="active">online</span>
                <!-- Typing indicator -->
                <span *ngIf="typingUsers$ | async as typingUsers" [class.hidden]="!typingUsers.length" class="ml-2 flex items-center text-fuchsia-300">
                  <span class="inline-flex space-x-1 mr-1">
                    <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1 h-1 bg-fuchsia-300 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                  </span>
                  typing...
                </span>
              </div>
            </div>
          </header>

          <!-- Messages -->
          <div id="messagesContainer" class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-16 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent border-b border-white/5">
            <!-- Loading state -->
            <app-loader [show]="loading" [overlay]="false" message="Loading messages..."></app-loader>

            <ng-container *ngIf="active && !loading; else emptyStateTemplate">
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
                  <div class="mt-1 text-[10px] text-neutral-400">
                    {{ m.time }}
                  </div>
                </div>
              </div>

              <!-- Typing indicator in messages area -->
              <div *ngIf="typingUsers$ | async as typingUsers" [class.hidden]="!typingUsers.length" class="flex">
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
              <div *ngIf="initialLoading" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <app-loader [show]="true" [overlay]="false" message="Loading chat..."></app-loader>
              </div>

              <!-- When conversations exist but none selected -->
              <div *ngIf="!initialLoading && conversations && conversations.length > 0 && !active" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
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
              <div *ngIf="!initialLoading && myRole === 'producer' && conversations && conversations.length === 0 && rejectedChats.length === 0" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>No conversations yet</p>
                  <p class="text-xs text-neutral-500">Search for actors to start a conversation</p>
                </div>
              </div>
              
              <!-- Producer: Rejected chats -->
              <div *ngIf="!initialLoading && myRole === 'producer' && rejectedChats.length > 0 && !active" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <p>You can message these actors:</p>
                  <div class="flex flex-col gap-2 w-full max-w-xs">
                    <ng-container *ngFor="let rejectedChat of rejectedChats">
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
              <div *ngIf="!initialLoading && myRole === 'actor' && viewMode === 'chat' && conversations && conversations.length === 0" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
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
              <div *ngIf="requestsLoading && myRole === 'actor' && viewMode === 'requests'" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <app-loader [show]="true" [overlay]="false" message="Loading requests..."></app-loader>
              </div>

              <!-- Actor: Requests tab with no requests -->
              <div *ngIf="!requestsLoading && myRole === 'actor' && viewMode === 'requests' && conversations && conversations.length === 0" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
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
              <div *ngIf="!initialLoading && !conversations" class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
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

          <!-- Composer -->
          <div 
            *ngIf="active && myRole === 'producer' && isRejectedByActor()"
            class="p-3 sm:p-4 pt-6 border-t border-white/5 flex items-center justify-center shrink-0 bg-neutral-900/60"
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
            class="p-3 sm:p-4 pt-6 border-t border-white/5 flex items-center gap-2 sm:gap-3 shrink-0 bg-neutral-900/60"
            *ngIf="active && ((myRole !== 'actor' && !isRejectedByActor()) || active.actorAccepted)"
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
  styles: [],
})
export class ChatComponent implements OnInit, OnDestroy {
  private chat = inject(ChatService);
  private auth = inject(AuthService);
  private actor = inject(ActorService);
  private user = inject(UserService);

  conversations: Conversation[] = [];
  active: Conversation | null = null;
  draft = '';
  mobileListOpen = false;
  loading = false;
  initialLoading = true;
  requestsLoading = true;

  meUid: string | null = null;
  myRole: UserRole = 'user';
  private roomsSub = new Subscription();
  private msgsSub = new Subscription();
  private typingSubscription = new Subscription();
  private counterpartByRoom = new Map<string, string>();
  private counterpartNames = new Map<string, string>();

  actors$?: Observable<UserDoc[]>;
  filteredActors$?: Observable<UserDoc[]>;
  private search$ = new BehaviorSubject<string>('');
  showActorDropdown = false;

  searchControl = new FormControl('');

  user$ = this.user

  // Actor: controls which list to show
  viewMode: 'chat' | 'requests' = 'chat';

  // Stream-driven state
  private viewMode$ = new BehaviorSubject<'chat' | 'requests'>(this.viewMode);
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
  isTyping = false;
  isSending = false;

  // Unread counts
  requestsCount$?: Observable<number>;
  totalUnreadCount$?: Observable<number>;
  
  // Rejected chats (for producers)
  rejectedChats$?: Observable<(ChatRoom & { id: string })[]>;
  rejectedChats: (ChatRoom & { id: string })[] = [];

  // Actor message search
  messageSearch = new FormControl('');
  get filteredActiveMessages(): Message[] {
    const q = (this.messageSearch.value || '').toString().trim().toLowerCase();
    const list = this.active?.messages ?? [];
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
      map(u => (u?.role as UserRole) || 'user'),
      shareReplay(1)
    );

    // Mirror role to existing field for template conditions that still use it
    this.roomsSub.add(this.myRole$.subscribe(r => this.myRole = r));

    // Total unread count for accepted chats (for chat tab)
    this.totalUnreadCount$ = this.myRole$.pipe(
      switchMap(role => this.chat.getTotalUnreadCount(this.meUid!, role)),
      shareReplay(1)
    );

    // For actors: count of producer-initiated threads (requests)
    this.requestsCount$ = this.myRole$.pipe(
      filter(role => role === 'actor'),
      switchMap(() => this.chat.getChatRequestsCount(this.meUid!)),
      tap(() => {
        // Set requestsLoading to false once we have requests data
        this.requestsLoading = false;
      }),
      shareReplay(1)
    );
    
    // Subscribe to requestsCount$ to ensure it's initialized
    this.roomsSub.add(this.requestsCount$?.subscribe());
    
    // For producers: observe rejected chats
    if (this.myRole === 'producer' && this.meUid) {
      this.rejectedChats$ = this.chat.observeRejectedChatsForProducer(this.meUid);
      this.roomsSub.add(
        this.rejectedChats$.subscribe(rejectedChats => {
          this.rejectedChats = rejectedChats;
        })
      );
    }

    // Check for cached rooms to show immediately
    const cachedRooms = this.chat.getCachedRooms(this.meUid!, this.myRole as UserRole);
    if (cachedRooms && cachedRooms.length > 0) {
      // Process cached rooms to show immediately
      this.processCachedRooms(cachedRooms);
    }

    // Producer: actor search streams
    this.roomsSub.add(this.myRole$.subscribe((role) => {
      if (role === 'producer') {
        this.actors$ = this.actor.getAllActors();
        this.filteredActors$ = combineLatest([
          this.actors$!,
          this.search$.pipe(debounceTime(150), distinctUntilChanged()),
        ]).pipe(
          map(([actors, term]) => {
            const t = (term || '').toLowerCase().trim();
            if (!t) return actors;
            return (actors || []).filter((a) =>
              (a.name || '').toLowerCase().includes(t) ||
              (a.location || '').toLowerCase().includes(t)
            );
          })
        );
      }
    }));

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

    // Mirror to existing conversations array for template
    this.roomsSub.add(this.conversations$!.subscribe(cs => {
      this.conversations = cs;
      // Set initialLoading to false once we have conversations data
      this.initialLoading = false;
    }));

    // Active conversation stream: restore last or pick first
    this.active$ = combineLatest([
      this.conversations$!,
      this.activeRoomId$,
    ]).pipe(
      map(([cs, id]) => {
        if (!cs.length) return null;
        if (id) {
          const found = cs.find(c => c.id === id);
          return found ?? cs[0];
        }
        return cs[0];
      }),
      tap((c: Conversation | null) => {
        if (!c) return;
        try { localStorage.setItem(this.LAST_ROOM_KEY, c.id); } catch {}
      }),
      shareReplay(1)
    );

    // Mirror to this.active for existing template usage
    this.roomsSub.add(this.active$!.subscribe(c => this.active = c));

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
              return {
                id: m.id!,
                from,
                text: m.text,
                time: this.formatTime(m.timestamp),
              } as Message;
            }));
            // Scroll to bottom immediately
            setTimeout(() => this.scrollToBottom(), 10);
          }, 0);
        }
        
        // Return the real-time updates from Firestore
        return this.chat.observeMessages(c.id);
      }),
      map((msgs: (ChatMessage & { id: string })[]) => msgs.map((m: ChatMessage & { id: string }) => {
        const from: 'me' | 'them' = m.senderId === this.meUid! ? 'me' : 'them';
        return {
          id: m.id!,
          from,
          text: m.text,
          time: this.formatTime(m.timestamp),
        } as Message;
      })),
      shareReplay(1)
    );

    // Mirror to active.messages so the existing template works without async pipe rewrites
    this.msgsSub.add(this.messages$!.subscribe(ms => {
      this.processMessages(ms);
    }));
  }

  // Process cached rooms to show immediately
  private processCachedRooms(rooms: (ChatRoom & { id: string })[]) {
    // Convert rooms to conversations
    const conversations: Conversation[] = rooms.map(r => {
      const counterpartId = this.getCounterpartId(r);
      this.counterpartByRoom.set(r.id!, counterpartId);
      return {
        id: r.id!,
        name: counterpartId, // Will be updated later with real name
        last: r.lastMessage?.text || '',
        unreadCount: r.unreadCount,
        actorAccepted: r.actorAccepted,
        actorRejected: r.actorRejected,
        messages: []
      };
    });

    // Update the conversations array
    this.conversations = conversations;

    // Set active conversation if we have a stored ID
    const lastRoomId = typeof localStorage !== 'undefined' ?
      localStorage.getItem(this.LAST_ROOM_KEY) : null;

    if (lastRoomId) {
      const found = conversations.find(c => c.id === lastRoomId);
      if (found) {
        this.active = found;
        // Load messages for this conversation
        const cachedMessages = this.chat.getCachedMessages(found.id);
        if (cachedMessages) {
          const messages = cachedMessages.map(m => {
            const from: 'me' | 'them' = m.senderId === this.meUid! ? 'me' : 'them';
            return {
              id: m.id!,
              from,
              text: m.text,
              time: this.formatTime(m.timestamp),
            } as Message;
          });
          found.messages = messages;
        }
      }
    }
  }

  // Process messages and update active conversation
  private processMessages(ms: Message[]) {
    if (this.active) {
      const prevLength = this.active.messages?.length || 0;
      this.active.messages = ms;

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
  }

  // Stream-based open with instant loading
  open(c: Conversation) {
    // Set active conversation immediately
    this.active = c;
    this.activeRoomId$.next(c.id);
    
    // Debug log to check conversation flags
    console.log(`Opening conversation ${c.id}, actorAccepted:`, c.actorAccepted, 'actorRejected:', c.actorRejected);
    
    // Mark messages as read when opening a conversation
    if (this.meUid) {
      // Mark messages as read and update notification count
      this.chat.markMessagesAsRead(c.id, this.meUid);
      
      // Force refresh of unread counts to update UI immediately
      if (this.totalUnreadCount$) {
        this.totalUnreadCount$.pipe(take(1)).subscribe();
      }
      
      // For actors, also refresh request counts
      if (this.myRole === 'actor' && this.requestsCount$) {
        this.requestsCount$.pipe(take(1)).subscribe();
      }
    }
    
    // Clear draft if this is a rejected conversation for a producer
    if (this.myRole === 'producer' && c.actorRejected) {
      this.draft = '';
    }
    
    // Check for cached messages first to show immediately
    const cachedMessages = this.chat.getCachedMessages(c.id);
    if (cachedMessages && cachedMessages.length > 0) {
      // Use cached messages immediately
      this.loading = false;
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
      this.loading = true;
      // Set a very short timeout to allow UI to update
      setTimeout(() => {
        this.loading = false;
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
    if (!this.typingHandler || !this.active) return;

    // Set typing state to true
    this.isTyping = true;
    this.typingHandler(true);
  }

  setViewMode(mode: 'chat' | 'requests') {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.viewMode$.next(mode);
  }

  async send() {
    const txt = this.draft.trim();
    if (!txt || !this.active || !this.meUid || this.isSending) return;
    
    // Prevent sending if the conversation has been rejected (for producers)
    if (this.myRole === 'producer' && this.isRejectedByActor()) {
      this.draft = '';
      return;
    }
    
    const roomId = this.active.id;
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
    };
    
    // Add to active conversation
    if (this.active && this.active.messages) {
      this.active.messages = [...this.active.messages, optimisticMessage];
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

  private getCounterpartId(r: ChatRoom): string {
    if (!this.meUid) return r.participants[0];
    return r.participants.find((p) => p !== this.meUid) || r.participants[0];
  }

  // Producer actor search dropdown handlers
  openActorDropdown() { this.showActorDropdown = true; }
  closeActorDropdownLater() { setTimeout(() => (this.showActorDropdown = false), 120); }
  onSearch(term: string) { this.search$.next(term); }
  async startChatWith(u: UserDoc) {
    if (!this.meUid || this.myRole !== 'producer') return;
    
    // Create a chat room without sending an initial message
    const roomId = await this.chat.producerStartChat(u.uid, this.meUid);
    
    // Find the conversation and open it
    const convo = this.conversations?.find(c => c.id === roomId);
    if (convo) {
      this.open(convo);
      // Set focus on the draft input
      setTimeout(() => {
        const draftInput = document.getElementById('message-draft');
        if (draftInput) {
          draftInput.focus();
        }
      }, 100);
    }
    
    this.showActorDropdown = false;
    this.mobileListOpen = false;
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
      if (this.active && this.active.id === c.id) {
        this.active.actorAccepted = true;
      }
      
      // Switch to chat view mode first
      this.setViewMode('chat');
      
      // Open the conversation after accepting
      this.open(c);
      
      // Force UI update by creating a new reference
      if (this.conversations) {
        const updatedConversations = this.conversations.map(conv => {
          if (conv.id === c.id) {
            return {...conv, actorAccepted: true};
          }
          return conv;
        });
        this.conversations = updatedConversations;
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
      this.conversations = this.conversations?.filter(conv => conv.id !== c.id) || [];
      // If this was the active conversation, clear it
      if (this.active?.id === c.id) {
        this.active = null;
      }
    } catch (error) {
      console.error('Error rejecting chat request:', error);
    }
  }
  
  // Handle click on mobile conversation item
  handleMobileItemClick(c: Conversation) {
    // If actor in requests view, do nothing (they need to use accept/reject buttons)
    if (this.myRole === 'actor' && this.viewMode === 'requests') {
      return;
    }
    
    // Otherwise open the conversation and close the mobile list
    this.open(c);
    this.mobileListOpen = false;
  }
  
  // Handle click on desktop conversation item
  handleDesktopItemClick(c: Conversation) {
    // If actor in requests view, do nothing (they need to use accept/reject buttons)
    if (this.myRole === 'actor' && this.viewMode === 'requests') {
      return;
    }
    
    // Otherwise open the conversation
    this.open(c);
  }

  openDefaultConversation() {
    if (this.conversations?.length) {
      this.open(this.conversations[0]);
      return;
    }
    if (this.myRole === 'producer') {
      this.openActorDropdown();
    }
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
    if (!this.active) return false;
    return this.active.actorRejected === true;
  }
  
  // Start a new chat with an actor (for producers, after rejection)
  async startChatWithActor(actorId: string) {
    if (!this.meUid || this.myRole !== 'producer') return;
    
    // Create a chat room without sending an initial message
    const roomId = await this.chat.producerStartChat(actorId, this.meUid);
    
    // Find the conversation and open it
    const convo = this.conversations?.find(c => c.id === roomId);
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
        const newConvo = this.conversations?.find(c => c.id === roomId);
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
            
            // Update the conversations array
            this.conversations = tempConversations;
          });
        } else {
          // No lookups needed, just update the conversations array
          this.conversations = tempConversations;
        }
      });
    }
  }
}
