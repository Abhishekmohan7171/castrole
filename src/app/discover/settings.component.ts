import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';

@Component({
  selector: 'app-discover-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6" [ngClass]="settingsTheme()">
      <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <!-- Left: Sidebar -->
        <aside class="rounded-2xl p-4 transition-all duration-300"
               [ngClass]="{
                 'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                 'bg-black/40 ring-2 ring-white/10 border border-neutral-800': !isActor()
               }">
          <h2 class="text-sm font-semibold mb-3"
              [ngClass]="{'text-purple-200/70': isActor(), 'text-neutral-300': !isActor()}">settings</h2>
          <nav class="space-y-1 text-sm">
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-900/15 bg-purple-900/20 text-purple-100/80': isActor(),
                      'ring-white/10 bg-white/5 text-neutral-200': !isActor()
                    }">
              account
              <div class="text-[11px]"
                   [ngClass]="{'text-purple-200/50': isActor(), 'text-neutral-500': !isActor()}">username, phone number, email, account type</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10': isActor(),
                      'ring-white/10 text-neutral-300 hover:bg-white/5': !isActor()
                    }">
              privacy & security
              <div class="text-[11px]"
                   [ngClass]="{'text-purple-200/50': isActor(), 'text-neutral-500': !isActor()}">visibility, password, activity status, 2fa, blocked users</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10': isActor(),
                      'ring-white/10 text-neutral-300 hover:bg-white/5': !isActor()
                    }">
              subscriptions
              <div class="text-[11px]"
                   [ngClass]="{'text-purple-200/50': isActor(), 'text-neutral-500': !isActor()}">manage subscription, plans, payments, history</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10': isActor(),
                      'ring-white/10 text-neutral-300 hover:bg-white/5': !isActor()
                    }">
              analytics
              <div class="text-[11px]"
                   [ngClass]="{'text-purple-200/50': isActor(), 'text-neutral-500': !isActor()}">profile views, reach, media library insights</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10': isActor(),
                      'ring-white/10 text-neutral-300 hover:bg-white/5': !isActor()
                    }">
              support & feedback
              <div class="text-[11px]"
                   [ngClass]="{'text-purple-200/50': isActor(), 'text-neutral-500': !isActor()}">help, bugs, feedback, contact</div>
            </button>
            <button class="w-full text-left rounded-xl px-3 py-3 ring-1 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-900/15 text-purple-300/60 hover:bg-purple-950/10': isActor(),
                      'ring-white/10 text-neutral-300 hover:bg-white/5': !isActor()
                    }">
              legal
              <div class="text-[11px]"
                   [ngClass]="{'text-purple-200/50': isActor(), 'text-neutral-500': !isActor()}">terms & conditions, privacy policy, guidelines, about us</div>
            </button>
          </nav>
        </aside>

        <!-- Right: Account panel -->
        <section class="rounded-2xl p-6 transition-all duration-300"
                 [ngClass]="{
                   'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                   'bg-black/40 ring-2 ring-white/10 border border-neutral-800': !isActor()
                 }">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold"
                [ngClass]="{'text-purple-200/70': isActor(), 'text-neutral-300': !isActor()}">account</h2>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Username/email/mobile fields -->
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <button class="h-8 w-8 rounded-full grid place-items-center ring-1 transition-all duration-200"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 text-purple-300/60 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 text-neutral-300 hover:bg-white/10': !isActor()
                        }" aria-label="edit username">✎</button>
                <div class="flex-1 h-10 px-4 rounded-xl ring-1 grid place-items-center text-sm transition-all duration-200"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 text-purple-200/60': isActor(),
                       'ring-white/10 bg-white/5 text-neutral-400': !isActor()
                     }">username</div>
              </div>
              <div class="flex items-center gap-3">
                <button class="h-8 w-8 rounded-full grid place-items-center ring-1 transition-all duration-200"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 text-purple-300/60 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 text-neutral-300 hover:bg-white/10': !isActor()
                        }" aria-label="edit email">✎</button>
                <div class="flex-1 h-10 px-4 rounded-xl ring-1 grid place-items-center text-sm transition-all duration-200"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 text-purple-200/60': isActor(),
                       'ring-white/10 bg-white/5 text-neutral-400': !isActor()
                     }">email</div>
              </div>
              <div class="flex items-center gap-3">
                <button class="h-8 w-8 rounded-full grid place-items-center ring-1 transition-all duration-200"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 text-purple-300/60 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 text-neutral-300 hover:bg-white/10': !isActor()
                        }" aria-label="edit mobile">✎</button>
                <div class="flex-1 h-10 px-4 rounded-xl ring-1 grid place-items-center text-sm transition-all duration-200"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 text-purple-200/60': isActor(),
                       'ring-white/10 bg-white/5 text-neutral-400': !isActor()
                     }">mobile</div>
              </div>
            </div>

            <!-- Add account tiles -->
            <div class="space-y-3">
              <div class="text-sm mb-1"
                   [ngClass]="{'text-purple-200/70': isActor(), 'text-neutral-300': !isActor()}">add account</div>
              <div class="grid grid-cols-2 gap-3">
                <button class="aspect-square rounded-xl ring-1 transition-all duration-200 grid place-items-center"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                        }">
                  <svg viewBox="0 0 24 24" class="h-10 w-10"
                       [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-300': !isActor()}"
                       fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </button>
                <button class="aspect-square rounded-xl ring-1 transition-all duration-200 grid place-items-center"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                        }">
                  <svg viewBox="0 0 24 24" class="h-10 w-10"
                       [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-300': !isActor()}"
                       fill="currentColor"><path d="M12 5.5c-2.48 0-4.5 2.02-4.5 4.5S9.52 14.5 12 14.5 16.5 12.48 16.5 10 14.48 5.5 12 5.5zM4 19c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z"/></svg>
                </button>
              </div>
            </div>
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
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private firestore = inject(Firestore);
  
  // User role signals
  userRole = signal<string>('actor');
  isActor = computed(() => this.userRole() === 'actor');
  settingsTheme = computed(() => this.isActor() ? 'actor-theme' : '');
  
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
          this.userRole.set(userData.currentRole || 'actor');
        }
      } catch (error) {
        // Default to actor if there's an error
        this.userRole.set('actor');
      }
    }
  }
}
