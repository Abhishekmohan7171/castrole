import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule,FormControl } from '@angular/forms';
import { inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { ChatService, ChatMessage, ChatRoom, UserRole } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { ActorService } from '../services/actor.service';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { ProducersService } from '../services/producers.service';
import { UserService } from '../services/user.service';

type Message = { id: string; from: 'me' | 'them'; text: string; time: string };
type Conversation = {
  id: string;
  name: string;
  last: string;
  unread?: number;
  messages: Message[];
};

@Component({
  selector: 'app-discover-chat',
  standalone: true,
  imports: [CommonModule, FormsModule,ReactiveFormsModule],
  template: `
    <div class="min-h-[70vh] text-neutral-200">
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <!-- Conversations (sidebar) -->
        <aside
          class="rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 border border-white/5 overflow-hidden hidden lg:block"
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
            }
          </div>
          <ul class="divide-y divide-white/5">
            <li
              *ngFor="let c of conversations"
              (click)="open(c)"
              class="px-4 py-3 cursor-pointer hover:bg-white/5 transition flex items-center gap-3"
              [ngClass]="{ 'bg-white/10': c.id === active?.id }"
            >
              <div
                class="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-neutral-400"
              >
                {{ c.name[0] | uppercase }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm text-neutral-100">{{ c.name }}</p>
                  <span
                    *ngIf="c.unread"
                    class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-600/30 text-fuchsia-200"
                    >{{ c.unread }}</span
                  >
                </div>
                <p class="truncate text-xs text-neutral-400">{{ c.last }}</p>
              </div>
            </li>
          </ul>
        </aside>

        <!-- Messages panel -->
        <section
          class="rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 border border-white/5 flex flex-col min-h-[60vh]"
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
            <ul class="max-h-72 overflow-auto divide-y divide-white/5">
              <li
                *ngFor="let c of conversations"
                (click)="open(c); mobileListOpen = false"
                class="px-4 py-3 cursor-pointer hover:bg-white/5 transition flex items-center gap-3"
                [ngClass]="{ 'bg-white/10': c.id === active?.id }"
              >
                <div
                  class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400"
                >
                  {{ c.name[0] | uppercase }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="truncate text-sm text-neutral-100">{{ c.name }}</p>
                  <p class="truncate text-xs text-neutral-400">{{ c.last }}</p>
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
              <div class="text-neutral-500">{{ active ? 'online' : '' }}</div>
            </div>
          </header>

          <!-- Messages -->
          <div class="flex-1 overflow-auto px-4 sm:px-6 py-4 space-y-4">
            <ng-container *ngIf="active; else emptyState">
              <div
                *ngFor="let m of active.messages"
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
            </ng-container>
            <ng-template #emptyState>
              <div
                class="h-40 flex items-center justify-center text-neutral-500 cursor-pointer select-none"
                (click)="openDefaultConversation()"
                title="Click to open a conversation"
              >
                Select a conversation to start messaging
              </div>
            </ng-template>
          </div>

          <!-- Composer -->
          <form
            (ngSubmit)="send()"
            class="p-3 sm:p-4 border-t border-white/5 flex items-center gap-2 sm:gap-3"
            *ngIf="active"
          >
            <input
              [(ngModel)]="draft"
              name="draft"
              placeholder="type a message"
              autocomplete="off"
              class="flex-1 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-fuchsia-500/30 transition"
            />
            <button
              type="submit"
              class="rounded-full px-4 py-2 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 text-neutral-100 transition disabled:opacity-50"
              [disabled]="!draft.trim()"
            >
              send
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

  private meUid: string | null = null;
  myRole: UserRole = 'user';
  private roomsSub?: Subscription;
  private msgsSub?: Subscription;
  private counterpartByRoom = new Map<string, string>();

  actors$?: Observable<UserDoc[]>;
  filteredActors$?: Observable<UserDoc[]>;
  private search$ = new BehaviorSubject<string>('');
  showActorDropdown = false;

  searchControl = new FormControl('');

  user$ = this.user

  async ngOnInit() {
    const me = this.auth.getCurrentUser();
    if (!me) {
      // not logged in; keep UI empty
      return;
    }
    this.meUid = me.uid;

    // Resolve my role from users/{uid}
    this.user.observeUser(me.uid).subscribe((u) => {
      this.myRole = (u?.role as UserRole) || 'user';
      this.subscribeRooms();
      // Only producers should query actors
      if (this.myRole === 'producer') {
        this.actors$ = this.actor.getAllActors();
        // Feed BehaviorSubject from the search control
        this.searchControl.valueChanges
          .pipe(debounceTime(150), distinctUntilChanged())
          .subscribe((val) => this.search$.next((val || '').toString()));

        // Live filter list using combineLatest of actors$ and current term
        this.filteredActors$ = combineLatest([
          this.actors$,
          this.search$,
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
      } else {
        this.showActorDropdown = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.roomsSub?.unsubscribe();
    this.msgsSub?.unsubscribe();
  }

  private subscribeRooms() {
    if (!this.meUid) return;
    this.roomsSub?.unsubscribe();
    this.roomsSub = this.chat
      .observeRoomsForUser(this.meUid, this.myRole)
      .subscribe(async (rooms) => {
        // Build conversation list with counterpart names and last previews
        const mapped: Conversation[] = [];
        for (const r of rooms) {
          const counterpartId = this.getCounterpartId(r);
          this.counterpartByRoom.set(r.id!, counterpartId);
          const u$ = this.user.observeUser(counterpartId);
          const uSnap = await u$.pipe().toPromise();
          const name = (uSnap?.name as string) || counterpartId;
          mapped.push({
            id: r.id!,
            name,
            last: r.lastMessage?.text || '',
            messages: [],
          });
        }
        this.conversations = mapped;
        if (!this.active && this.conversations.length) {
          this.open(this.conversations[0]);
        }
      });
  }

  open(c: Conversation) {
    this.active = c;
    this.msgsSub?.unsubscribe();
    if (!c?.id) return;
    this.msgsSub = this.chat.observeMessages(c.id).subscribe((msgs) => {
      c.messages = msgs.map((m) => this.toUiMessage(m));
      if (msgs.length) {
        c.last = msgs[msgs.length - 1].text;
      }
    });
  }

  async send() {
    const txt = this.draft.trim();
    if (!txt || !this.active || !this.meUid) return;
    const roomId = this.active.id;
    const receiverId = this.counterpartByRoom.get(roomId) || '';
    await this.chat.sendMessage({
      roomId,
      senderId: this.meUid,
      receiverId,
      text: txt,
    });
    this.draft = '';
  }

  private toUiMessage(m: ChatMessage): Message {
    const from: 'me' | 'them' = m.senderId === this.meUid ? 'me' : 'them';
    const time = this.tsToTime(m.timestamp);
    return { id: m.id!, from, text: m.text, time };
  }

  private tsToTime(ts: any): string {
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
    console.log('startChatWith', u);
    if (!this.meUid || this.myRole !== 'producer') return;
    // Auto-start the conversation by sending the first message from producer
    const greeting = 'Hi! Thanks for connecting.';
    const roomId = await this.chat.producerStartChat(u.uid, this.meUid, greeting);
    this.counterpartByRoom.set(roomId, u.uid);
    let existing = this.conversations.find((c) => c.id === roomId);
    if (!existing) {
      const conv: Conversation = { id: roomId, name: u.name || u.uid, last: greeting, messages: [] };
      this.conversations = [conv, ...this.conversations];
      existing = conv;
    } else {
      existing.last = greeting;
    }
    this.open(existing);
    this.showActorDropdown = false;
    this.mobileListOpen = false;
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
}
