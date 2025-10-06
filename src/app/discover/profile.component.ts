import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';
 

@Component({
  selector: 'app-discover-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 md:py-6" [ngClass]="profileTheme()">
      <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 md:gap-8 lg:gap-10">
        <!-- Left: Profile card + media -->
        <section class="space-y-5">
          <!-- Profile card (role-based theming) -->
          <div class="rounded-2xl p-5 transition-all duration-300"
               [ngClass]="{
                 'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                 'bg-black/50 ring-2 ring-white/10 border border-neutral-800': !isActor()
               }">
            <div class="flex items-start gap-4">
              <!-- circular avatar placeholder with ring -->
              <div class="relative h-20 w-20 sm:h-24 sm:w-24">
                <div class="absolute inset-0 rounded-full transition-all duration-300"
                     [ngClass]="{
                       'ring-1 ring-purple-900/20': isActor(),
                       'ring-1 ring-white/15': !isActor()
                     }"></div>
                <div class="absolute inset-2 rounded-full transition-all duration-300"
                     [ngClass]="{
                       'bg-purple-950/5': isActor(),
                       'bg-white/5': !isActor()
                     }"></div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h1 class="text-lg sm:text-xl font-semibold"
                      [ngClass]="{'text-purple-100/90': isActor(), 'text-neutral-100': !isActor()}">m rahul</h1>
                  <span class="px-2 py-0.5 text-[11px] rounded-full ring-1 transition-all duration-300"
                        [ngClass]="{
                          'ring-purple-900/20 bg-purple-950/20 text-purple-300/70': isActor(),
                          'ring-emerald-500/30 bg-emerald-500/10 text-emerald-300': !isActor()
                        }">{{ userRole() }}</span>
                  <!-- mini icons to the right of name -->
                  <button class="ml-2 h-6 w-6 grid place-items-center rounded-full ring-1 transition-all duration-200"
                          [ngClass]="{
                            'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                            'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                          }" aria-label="play">
                    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"
                         [ngClass]="{'text-purple-300/60': isActor(), 'text-neutral-300': !isActor()}">
                      <path fill="currentColor" d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                  <button class="h-6 w-6 grid place-items-center rounded-full ring-1 transition-all duration-200"
                          [ngClass]="{
                            'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                            'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                          }" aria-label="edit" (click)="navigateToSettings()">
                    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"
                         [ngClass]="{'text-purple-300/60': isActor(), 'text-neutral-300': !isActor()}">
                      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                    </svg>
                  </button>
                </div>
                <div class="mt-3 grid grid-cols-4 gap-2 text-[11px]"
                     [ngClass]="{'text-purple-200/70': isActor(), 'text-neutral-300': !isActor()}">
                  <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                       [ngClass]="{
                         'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                         'bg-white/5 ring-1 ring-white/10': !isActor()
                       }">25 <span class="opacity-60">age</span></div>
                  <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                       [ngClass]="{
                         'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                         'bg-white/5 ring-1 ring-white/10': !isActor()
                       }">male <span class="opacity-60">gender</span></div>
                  <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                       [ngClass]="{
                         'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                         'bg-white/5 ring-1 ring-white/10': !isActor()
                       }">180cm <span class="opacity-60">height</span></div>
                  <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                       [ngClass]="{
                         'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                         'bg-white/5 ring-1 ring-white/10': !isActor()
                       }">80kg <span class="opacity-60">weight</span></div>
                </div>
                <!-- fake waveform row -->
                <div class="mt-3 h-6 flex items-end gap-0.5"
                     [ngClass]="{'text-purple-400/40': isActor(), 'text-fuchsia-300/70': !isActor()}">
                  <span class="block w-0.5 h-2 bg-current"></span>
                  <span class="block w-0.5 h-4 bg-current"></span>
                  <span class="block w-0.5 h-3 bg-current"></span>
                  <span class="block w-0.5 h-5 bg-current"></span>
                  <span class="block w-0.5 h-3 bg-current"></span>
                  <span class="block w-0.5 h-6 bg-current"></span>
                </div>
              </div>
              <!-- tiny action icons -->
              <div class="flex flex-col items-center gap-2"
                   [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-400': !isActor()}">
                <button class="h-7 w-7 rounded-full ring-1 transition-all duration-200"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                        }" aria-label="options"></button>
                <button class="h-7 w-7 rounded-full ring-1 transition-all duration-200"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                        }" aria-label="play"></button>
              </div>
            </div>
          </div>

          <!-- Media tabs -->
          <div>
            <div class="inline-flex items-center gap-2 rounded-full p-1 transition-all duration-300"
                 [ngClass]="{
                   'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                   'bg-white/5 ring-1 ring-white/10': !isActor()
                 }">
              <button class="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                      [ngClass]="{
                        'bg-purple-900/20 text-purple-200': mediaTab==='videos' && isActor(),
                        'text-purple-300/60': mediaTab!=='videos' && isActor(),
                        'bg-white/10 text-neutral-100': mediaTab==='videos' && !isActor(),
                        'text-neutral-400': mediaTab!=='videos' && !isActor()
                      }"
                      (click)="mediaTab='videos'">videos</button>
              <button class="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                      [ngClass]="{
                        'bg-purple-900/20 text-purple-200': mediaTab==='photos' && isActor(),
                        'text-purple-300/60': mediaTab!=='photos' && isActor(),
                        'bg-white/10 text-neutral-100': mediaTab==='photos' && !isActor(),
                        'text-neutral-400': mediaTab!=='photos' && !isActor()
                      }"
                      (click)="mediaTab='photos'">photos</button>
            </div>

            <!-- Color tile grid, role-based theming -->
            <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
              <div class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 cursor-pointer"
                   [ngClass]="{
                     'ring-purple-900/10 bg-gradient-to-br from-purple-950/20 to-purple-900/10 hover:ring-purple-900/20': isActor(),
                     'ring-white/10 bg-green-800/50 hover:ring-white/20': !isActor()
                   }">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide"
                      [ngClass]="{'text-purple-200/60': isActor(), 'text-white/80': !isActor()}">cassette</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 cursor-pointer"
                   [ngClass]="{
                     'ring-purple-900/10 bg-gradient-to-br from-purple-950/15 to-purple-900/10 hover:ring-purple-900/20': isActor(),
                     'ring-white/10 bg-emerald-900/50 hover:ring-white/20': !isActor()
                   }">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide"
                      [ngClass]="{'text-purple-200/60': isActor(), 'text-white/80': !isActor()}">character reel</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 cursor-pointer"
                   [ngClass]="{
                     'ring-purple-900/10 bg-gradient-to-br from-purple-950/20 to-purple-900/15 hover:ring-purple-900/20': isActor(),
                     'ring-white/10 bg-red-900/60 hover:ring-white/20': !isActor()
                   }">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide"
                      [ngClass]="{'text-purple-200/60': isActor(), 'text-white/80': !isActor()}">album</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 hidden sm:block relative overflow-hidden transition-all duration-200 cursor-pointer"
                   [ngClass]="{
                     'ring-purple-900/10 bg-gradient-to-br from-purple-950/15 to-purple-900/10 hover:ring-purple-900/20': isActor(),
                     'ring-white/10 bg-purple-900/50 hover:ring-white/20': !isActor()
                   }">
                <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide"
                      [ngClass]="{'text-purple-200/60': isActor(), 'text-white/80': !isActor()}">showreel</span>
              </div>
              <div class="aspect-video rounded-lg ring-1 hidden sm:block transition-all duration-200 cursor-pointer"
                   [ngClass]="{
                     'ring-purple-900/10 bg-purple-950/10 hover:ring-purple-900/20': isActor(),
                     'ring-white/10 bg-neutral-800/70 hover:ring-white/20': !isActor()
                   }"></div>
              <div class="aspect-video rounded-lg ring-1 hidden sm:block transition-all duration-200 cursor-pointer"
                   [ngClass]="{
                     'ring-purple-900/10 bg-purple-950/15 hover:ring-purple-900/20': isActor(),
                     'ring-white/10 bg-neutral-700/60 hover:ring-white/20': !isActor()
                   }"></div>
            </div>

            <!-- Social links row -->
            <div class="mt-4">
              <div class="text-xs mb-2 transition-colors duration-300"
                   [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">social links</div>
              <div class="flex items-center gap-3">
                @for (i of [1, 2, 3, 4]; track i) {
                  <a href="#" class="h-7 w-7 rounded-full ring-1 transition-all duration-200"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                       'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                     }" aria-label="link"></a>
                }
              </div>
            </div>
          </div>
        </section>

        <!-- Right: Details -->
        <section class="space-y-4 sm:space-y-6">
          <div class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
               [ngClass]="{
                 'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                 'bg-black/50 ring-2 ring-white/10 border border-neutral-800': !isActor()
               }">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
              <div>
                <dt class="text-xs uppercase tracking-wide"
                    [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">location</dt>
                <dd class="text-sm"
                    [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">perumbavoor, ernakulam</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide"
                    [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">acting education</dt>
                <dd class="text-sm"
                    [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">xyz school of acting<br/>diploma in acting</dd>
                <dd><a class="text-xs hover:underline transition-colors duration-300"
                       [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}" href="#">view certificate</a></dd>
              </div>

              <div class="sm:col-span-2">
                <dt class="text-xs uppercase tracking-wide"
                    [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">experiences</dt>
                <dd class="mt-1 space-y-3 md:space-y-4">
                  <div class="p-2 sm:p-3 rounded-lg transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <div class="text-sm font-medium"
                         [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">a journey within</div>
                    <div class="text-xs"
                         [ngClass]="{'text-purple-200/60': isActor(), 'text-neutral-400': !isActor()}">supporting role | tv series | thriller | 2012</div>
                    <a class="text-xs hover:underline transition-colors duration-300"
                       [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}"
                       href="https://www.linkforproject.com" target="_blank">www.linkforproject.com</a>
                  </div>
                  <div class="p-2 sm:p-3 rounded-lg transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <div class="text-sm font-medium"
                         [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">city lights</div>
                    <div class="text-xs"
                         [ngClass]="{'text-purple-200/60': isActor(), 'text-neutral-400': !isActor()}">lead role | film | comedy | 2020</div>
                    <a class="text-xs hover:underline transition-colors duration-300"
                       [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}"
                       href="https://www.linkforproject.com" target="_blank">www.linkforproject.com</a>
                  </div>
                </dd>
              </div>

              <div>
                <dt class="text-xs uppercase tracking-wide mb-2"
                    [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">languages</dt>
                <dd class="text-sm space-y-2 mt-1"
                    [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <span>malayalam</span><span [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">★★★★★</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <span>english</span><span [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">★★★★★</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <span>hindi</span><span [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">★★★★☆</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <span>tamil</span><span [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">★★★☆☆</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <span>telugu</span><span [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">★★☆☆☆</span>
                  </div>
                </dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide mb-2"
                    [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">extra curricular</dt>
                <dd class="text-sm space-y-2 mt-1"
                    [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <span>singing</span><span [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">★★★☆☆</span>
                  </div>
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                       [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                    <span>guitar</span><span [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">★★★★★</span>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
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
      background: radial-gradient(ellipse at top left, rgba(147, 51, 234, 0.03) 0%, transparent 40%),
                  radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.02) 0%, transparent 40%);
      pointer-events: none;
      z-index: 0;
    }
    .actor-theme {
      position: relative;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private firestore = inject(Firestore);
  private router = inject(Router);
  
  mediaTab: 'videos' | 'photos' = 'videos';
  
  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
  profileTheme = computed(() => this.isActor() ? 'actor-theme' : '');
  
  ngOnInit() {
    this.loadUserRole();
  }
  
  private async loadUserRole() {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          this.userRole.set(userData.role || 'actor');
        }
      } catch (error) {
        // Default to actor if there's an error
        this.userRole.set('actor');
      }
    }
  }
  
  navigateToSettings() {
    this.router.navigate(['/discover/settings']);
  }
}
