import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-discover-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Search + tabs -->
    <section>
      <div class="flex flex-col gap-4">
        <!-- Search -->
        <div class="relative max-w-xl w-full">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="search roles, projects, people..."
            class="w-full bg-neutral-900/70 text-neutral-200 placeholder-neutral-500 rounded-full pl-11 pr-4 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-fuchsia-500/40 transition"
            (input)="onSearch($any($event.target).value)"
          />
        </div>

        <!-- Tabs -->
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="px-4 py-2 rounded-full text-sm ring-1 ring-white/10" [ngClass]="{'bg-white/10': tab==='foryou'}" (click)="tab='foryou'">for you</button>
          <button type="button" class="px-4 py-2 rounded-full text-sm ring-1 ring-white/10" [ngClass]="{'bg-white/10': tab==='trending'}" (click)="tab='trending'">trending</button>
          <button type="button" class="px-4 py-2 rounded-full text-sm ring-1 ring-white/10" [ngClass]="{'bg-white/10': tab==='new'}" (click)="tab='new'">new</button>
        </div>
      </div>
    </section>

    <!-- Content grid -->
    <section class="mt-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ng-container *ngFor="let item of filteredItems">
          <article class="group rounded-2xl bg-neutral-900/60 border border-white/5 p-4 flex flex-col gap-4 ring-1 ring-white/10 hover:ring-white/20 transition">
            <!-- Thumbnail / avatar -->
            <div class="aspect-video rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 ring-1 ring-white/10 flex items-center justify-center text-neutral-500">
              <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 6h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8" />
                <path d="M6 18 2 12 6 6v12Z" />
              </svg>
            </div>

            <div class="flex-1 flex flex-col gap-2">
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-base font-semibold text-neutral-100 line-clamp-2">{{ item.title }}</h3>
                <span class="text-xs px-2 py-1 rounded-full ring-1 ring-white/10"
                      [ngClass]="{
                        'bg-emerald-500/10 text-emerald-300': role==='actor',
                        'bg-indigo-500/10 text-indigo-300': role==='producer'
                      }">
                  {{ item.tag }}
                </span>
              </div>

              <p class="text-sm text-neutral-400 line-clamp-2">{{ item.subtitle }}</p>

              <div class="mt-1 text-xs text-neutral-500 flex items-center gap-3">
                <span class="truncate">{{ item.metaA }}</span>
                <span class="h-1 w-1 rounded-full bg-neutral-700"></span>
                <span class="truncate">{{ item.metaB }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button type="button" class="flex-1 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-white/10 bg-white/5 hover:bg-white/10 text-neutral-100 transition"
                      (click)="onPrimary(item)">
                {{ primaryCtaLabel }}
              </button>
              <a routerLink="/" class="rounded-full px-4 py-2 text-sm ring-1 ring-white/10 text-neutral-300 hover:text-white transition">details</a>
            </div>
          </article>
        </ng-container>
      </div>

      <!-- Empty state -->
      <div *ngIf="filteredItems.length === 0" class="text-center text-neutral-500 py-20">No results</div>
    </section>
  `,
  styles: []
})
export class FeedComponent {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  role: 'actor' | 'producer' = 'actor';
  tab: 'foryou' | 'trending' | 'new' = 'foryou';
  search = '';

  private actorItems = [
    { id: 'a1', title: 'Lead role in indie drama', subtitle: 'Male, 20-30 • Mumbai • Paid', tag: 'audition', metaA: 'Deadline: Sep 30', metaB: 'Applicants: 124' },
    { id: 'a2', title: 'Web series supporting cast', subtitle: 'Female, 22-35 • Remote • Paid', tag: 'audition', metaA: 'Deadline: Oct 10', metaB: 'Applicants: 89' },
    { id: 'a3', title: 'TV ad - fitness brand', subtitle: 'All genders, 18-28 • Bangalore • Paid', tag: 'ad', metaA: 'Shoot: 2 days', metaB: 'Applicants: 210' },
  ];

  private producerItems = [
    { id: 'p1', title: 'Arjun K • 5y experience', subtitle: 'Action | Drama | Hindi, English', tag: 'actor', metaA: 'Mumbai', metaB: 'Shortlist score: 92' },
    { id: 'p2', title: 'Meera S • 3y experience', subtitle: 'Romance | Comedy | Tamil, Telugu', tag: 'actor', metaA: 'Chennai', metaB: 'Shortlist score: 88' },
    { id: 'p3', title: 'Ravi T • Newcomer', subtitle: 'Theatre | Hindi', tag: 'actor', metaA: 'Delhi', metaB: 'Shortlist score: 76' },
  ];

  get items() { return this.role === 'actor' ? this.actorItems : this.producerItems; }

  get filteredItems() {
    const q = this.search.trim().toLowerCase();
    const base = this.items;
    if (!q) return base;
    return base.filter(i => [i.title, i.subtitle, i.tag, i.metaA, i.metaB].some(v => (v || '').toLowerCase().includes(q)));
  }

  get primaryCtaLabel() { return this.role === 'actor' ? 'apply' : 'shortlist'; }

  constructor() {
    const qpRole = this.route.snapshot.queryParamMap.get('role');
    const stored = isPlatformBrowser(this.platformId) ? localStorage.getItem('role') : null;
    const resolved = (qpRole || stored || 'actor').toLowerCase();
    this.role = resolved === 'producer' ? 'producer' : 'actor';
    if (qpRole && isPlatformBrowser(this.platformId)) localStorage.setItem('role', this.role);
  }

  onSearch(q: string) { this.search = q; }

  onPrimary(item: any) {
    if (this.role === 'actor') {
      console.log('[discover] apply', item);
    } else {
      console.log('[discover] shortlist', item);
    }
  }
}
