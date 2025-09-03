import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Message = { id: string; from: 'me' | 'them'; text: string; time: string };
type Conversation = { id: string; name: string; last: string; unread?: number; messages: Message[] };

@Component({
  selector: 'app-discover-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-[70vh] text-neutral-200">
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <!-- Conversations (sidebar) -->
        <aside class="rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 border border-white/5 overflow-hidden hidden lg:block">
          <div class="p-4 border-b border-white/5">
            <input type="search" placeholder="search"
                   class="w-full bg-neutral-900 text-neutral-200 placeholder-neutral-500 rounded-full px-4 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-fuchsia-500/30 transition"/>
          </div>
          <ul class="divide-y divide-white/5">
            <li *ngFor="let c of conversations" (click)="open(c)"
                class="px-4 py-3 cursor-pointer hover:bg-white/5 transition flex items-center gap-3"
                [ngClass]="{ 'bg-white/10': c.id===active?.id }">
              <div class="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-neutral-400">{{ c.name[0] | uppercase }}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm text-neutral-100">{{ c.name }}</p>
                  <span *ngIf="c.unread" class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-600/30 text-fuchsia-200">{{ c.unread }}</span>
                </div>
                <p class="truncate text-xs text-neutral-400">{{ c.last }}</p>
              </div>
            </li>
          </ul>
        </aside>

        <!-- Messages panel -->
        <section class="rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 border border-white/5 flex flex-col min-h-[60vh]">
          <!-- Mobile conversations header -->
          <div class="lg:hidden p-4 border-b border-white/5 flex items-center gap-3">
            <button type="button" (click)="mobileListOpen = !mobileListOpen" class="px-3 py-1.5 rounded-full text-xs ring-1 ring-white/10 text-neutral-300 bg-white/5">conversations</button>
            <div class="text-sm text-neutral-400">{{ active?.name || 'select a chat' }}</div>
          </div>

          <!-- Mobile conversations drawer -->
          <div *ngIf="mobileListOpen" class="lg:hidden border-b border-white/5">
            <ul class="max-h-72 overflow-auto divide-y divide-white/5">
              <li *ngFor="let c of conversations" (click)="open(c); mobileListOpen=false"
                  class="px-4 py-3 cursor-pointer hover:bg-white/5 transition flex items-center gap-3"
                  [ngClass]="{ 'bg-white/10': c.id===active?.id }">
                <div class="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400">{{ c.name[0] | uppercase }}</div>
                <div class="flex-1 min-w-0">
                  <p class="truncate text-sm text-neutral-100">{{ c.name }}</p>
                  <p class="truncate text-xs text-neutral-400">{{ c.last }}</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Chat header -->
          <header class="hidden lg:flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <div class="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-neutral-400">{{ active?.name?.[0] | uppercase }}</div>
            <div class="text-sm">
              <div class="text-neutral-100">{{ active?.name || 'select a chat' }}</div>
              <div class="text-neutral-500">{{ active ? 'online' : '' }}</div>
            </div>
          </header>

          <!-- Messages -->
          <div class="flex-1 overflow-auto px-4 sm:px-6 py-4 space-y-4">
            <ng-container *ngIf="active; else emptyState">
              <div *ngFor="let m of active.messages" class="flex" [class.justify-end]="m.from==='me'">
                <div class="max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2 text-sm"
                     [ngClass]="{
                       'bg-white/10 text-neutral-100 rounded-tr-sm': m.from==='them',
                       'bg-fuchsia-600/20 text-fuchsia-100 rounded-tl-sm': m.from==='me'
                     }">
                  <div>{{ m.text }}</div>
                  <div class="mt-1 text-[10px] text-neutral-400">{{ m.time }}</div>
                </div>
              </div>
            </ng-container>
            <ng-template #emptyState>
              <div class="h-40 flex items-center justify-center text-neutral-500">Select a conversation to start messaging</div>
            </ng-template>
          </div>

          <!-- Composer -->
          <form (ngSubmit)="send()" class="p-3 sm:p-4 border-t border-white/5 flex items-center gap-2 sm:gap-3" *ngIf="active">
            <input [(ngModel)]="draft" name="draft" placeholder="type a message" autocomplete="off"
                   class="flex-1 bg-neutral-900 text-neutral-100 placeholder-neutral-500 rounded-full px-4 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-fuchsia-500/30 transition" />
            <button type="submit" class="rounded-full px-4 py-2 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 text-neutral-100 transition disabled:opacity-50" [disabled]="!draft.trim()">send</button>
          </form>
        </section>
      </div>
    </div>
  `,
  styles: []
})
export class ChatComponent {
  conversations: Conversation[] = [
    {
      id: 'c1',
      name: 'Arjun Kumar',
      last: 'Sure, sending the brief now…',
      unread: 2,
      messages: [
        { id: 'm1', from: 'them', text: 'Hey, saw your reel. Interested for a short film?', time: '10:02' },
        { id: 'm2', from: 'me', text: 'Thanks! Would love to hear more.', time: '10:05' },
        { id: 'm3', from: 'them', text: 'Great. Budget is ₹25k, 2-day shoot in Mumbai.', time: '10:10' },
      ]
    },
    {
      id: 'c2',
      name: 'Meera Studio',
      last: 'Audition on Friday works?',
      messages: [
        { id: 'm1', from: 'them', text: 'Audition on Friday works?', time: '09:30' }
      ]
    },
    {
      id: 'c3',
      name: 'Ravi T',
      last: 'Sending portfolio link',
      messages: [
        { id: 'm1', from: 'them', text: 'Sending portfolio link', time: 'Yesterday' }
      ]
    }
  ];

  active: Conversation | null = this.conversations[0];
  draft = '';
  mobileListOpen = false;

  open(c: Conversation) { this.active = c; }

  send() {
    const txt = this.draft.trim();
    if (!txt || !this.active) return;
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    this.active.messages.push({ id: this.makeId(), from: 'me', text: txt, time: `${hh}:${mm}` });
    this.active.last = txt;
    this.draft = '';
  }
  private makeId(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
}
