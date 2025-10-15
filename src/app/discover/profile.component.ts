import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { Profile } from '../../assets/interfaces/profile.interfaces';
import { EditProfileModalComponent } from './edit-profile-modal.component';
 

@Component({
  selector: 'app-discover-profile',
  standalone: true,
  imports: [CommonModule, EditProfileModalComponent],
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
              <!-- Profile image -->
              <div class="relative h-20 w-20 sm:h-24 sm:w-24">
                <div class="absolute inset-0 rounded-full overflow-hidden transition-all duration-300"
                     [ngClass]="{
                       'ring-1 ring-purple-900/20': isActor(),
                       'ring-1 ring-white/15': !isActor()
                     }">
                  @if (getProfileImageUrl()) {
                    <img [src]="getProfileImageUrl()" [alt]="getDisplayName()" class="w-full h-full object-cover">
                  } @else {
                    <div class="w-full h-full rounded-full transition-all duration-300"
                         [ngClass]="{
                           'bg-purple-950/20': isActor(),
                           'bg-white/10': !isActor()
                         }"></div>
                  }
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h1 class="text-lg sm:text-xl font-semibold"
                      [ngClass]="{'text-purple-100/90': isActor(), 'text-neutral-100': !isActor()}">{{ getDisplayName() }}</h1>
                  <span class="px-2 py-0.5 text-[11px] rounded-full ring-1 transition-all duration-300"
                        [ngClass]="{
                          'ring-purple-900/20 bg-purple-950/20 text-purple-300/70': isActor(),
                          'ring-emerald-500/30 bg-emerald-500/10 text-emerald-300': !isActor()
                        }">{{ userRole() }}</span>
                  
                  <!-- Voice intro play button - Actor only -->
                  @if (isActor() && profileData()?.actorProfile?.voiceIntro) {
                    <button class="ml-2 h-6 w-6 grid place-items-center rounded-full ring-1 transition-all duration-200"
                            [ngClass]="{
                              'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                              'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                            }" 
                            aria-label="play voice intro"
                            (click)="playVoiceIntro()">
                      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"
                           [ngClass]="{'text-purple-300/60': isActor(), 'text-neutral-300': !isActor()}">
                        <path fill="currentColor" d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  }
                  
                  <button class="h-6 w-6 grid place-items-center rounded-full ring-1 transition-all duration-200"
                          [ngClass]="{
                            'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                            'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                          }" aria-label="edit" (click)="openEditModal()">
                    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"
                         [ngClass]="{'text-purple-300/60': isActor(), 'text-neutral-300': !isActor()}">
                      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                    </svg>
                  </button>
                </div>
                
                <!-- Basic info grid - different for Actor vs Producer -->
                @if (isActor()) {
                  <!-- Actor basic info -->
                  <div class="mt-3 grid grid-cols-4 gap-2 text-[11px]"
                       [ngClass]="{'text-purple-200/70': isActor(), 'text-neutral-300': !isActor()}">
                    @if (profileData()?.gender) {
                      <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                           [ngClass]="{
                             'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                             'bg-white/5 ring-1 ring-white/10': !isActor()
                           }">{{ profileData()?.gender }} <span class="opacity-60">gender</span></div>
                    }
                    @if (profileData()?.actorProfile?.height) {
                      <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                           [ngClass]="{
                             'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                             'bg-white/5 ring-1 ring-white/10': !isActor()
                           }">{{ profileData()?.actorProfile?.height }} <span class="opacity-60">height</span></div>
                    }
                    @if (profileData()?.actorProfile?.weight) {
                      <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                           [ngClass]="{
                             'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                             'bg-white/5 ring-1 ring-white/10': !isActor()
                           }">{{ profileData()?.actorProfile?.weight }} <span class="opacity-60">weight</span></div>
                    }
                    @if (profileData()?.location) {
                      <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                           [ngClass]="{
                             'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                             'bg-white/5 ring-1 ring-white/10': !isActor()
                           }">{{ getShortLocation() }} <span class="opacity-60">location</span></div>
                    }
                  </div>
                } @else {
                  <!-- Producer basic info -->
                  <div class="mt-3 grid grid-cols-3 gap-2 text-[11px]"
                       [ngClass]="{'text-purple-200/70': isActor(), 'text-neutral-300': !isActor()}">
                    @if (profileData()?.age) {
                      <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                           [ngClass]="{
                             'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                             'bg-white/5 ring-1 ring-white/10': !isActor()
                           }">{{ profileData()?.age }} <span class="opacity-60">age</span></div>
                    }
                    @if (profileData()?.gender) {
                      <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                           [ngClass]="{
                             'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                             'bg-white/5 ring-1 ring-white/10': !isActor()
                           }">{{ profileData()?.gender }} <span class="opacity-60">gender</span></div>
                    }
                    @if (profileData()?.location) {
                      <div class="rounded-md px-2 py-1 text-center transition-all duration-200"
                           [ngClass]="{
                             'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                             'bg-white/5 ring-1 ring-white/10': !isActor()
                           }">{{ getShortLocation() }} <span class="opacity-60">location</span></div>
                    }
                  </div>
                }
                
                <!-- Voice waveform - Actor only -->
                @if (isActor() && profileData()?.actorProfile?.voiceIntro) {
                  <div class="mt-3 h-6 flex items-end gap-0.5"
                       [ngClass]="{'text-purple-400/40': isActor(), 'text-fuchsia-300/70': !isActor()}">
                    <span class="block w-0.5 h-2 bg-current"></span>
                    <span class="block w-0.5 h-4 bg-current"></span>
                    <span class="block w-0.5 h-3 bg-current"></span>
                    <span class="block w-0.5 h-5 bg-current"></span>
                    <span class="block w-0.5 h-3 bg-current"></span>
                    <span class="block w-0.5 h-6 bg-current"></span>
                  </div>
                }
              </div>
              <!-- tiny action icons -->
              <div class="flex flex-col items-center gap-2"
                   [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-400': !isActor()}">
                <button class="h-7 w-7 rounded-full ring-1 transition-all duration-200"
                        [ngClass]="{
                          'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                          'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                        }" aria-label="options"></button>
                @if (isActor() && profileData()?.actorProfile?.voiceIntro) {
                  <button class="h-7 w-7 rounded-full ring-1 transition-all duration-200"
                          [ngClass]="{
                            'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                            'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                          }" 
                          aria-label="play voice intro"
                          (click)="playVoiceIntro()"></button>
                }
              </div>
            </div>
          </div>

          <!-- Media tabs - Actor only -->
          @if (isActor()) {
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

              <!-- Media grid - Actor carousel images -->
              @if (hasCarouselImages()) {
                <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                  @for (imageUrl of profileData()?.actorProfile?.carouselImagesUrl; track imageUrl) {
                    <div class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 cursor-pointer"
                         [ngClass]="{
                           'ring-purple-900/10 hover:ring-purple-900/20': isActor(),
                           'ring-white/10 hover:ring-white/20': !isActor()
                         }">
                      <img [src]="imageUrl" alt="Portfolio image" class="w-full h-full object-cover">
                    </div>
                  }
                </div>
              } @else {
                <!-- Placeholder grid for actors without media -->
                <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 cursor-pointer"
                       [ngClass]="{
                         'ring-purple-900/10 bg-gradient-to-br from-purple-950/20 to-purple-900/10 hover:ring-purple-900/20': isActor(),
                         'ring-white/10 bg-green-800/50 hover:ring-white/20': !isActor()
                       }">
                    <span class="absolute top-1.5 left-2 text-[10px] uppercase tracking-wide"
                          [ngClass]="{'text-purple-200/60': isActor(), 'text-white/80': !isActor()}">add media</span>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Social links -->
          @if (hasSocialLinks() || isActor()) {
            <div class="mt-4">
              <div class="text-xs mb-2 transition-colors duration-300"
                   [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">social links</div>
              <div class="flex items-center gap-3">
                @if (profileData()?.social?.instaIdUrl) {
                  <a [href]="profileData()?.social?.instaIdUrl" target="_blank" 
                     class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                       'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                     }" aria-label="Instagram">
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0-2.2c-3.3 0-3.7 0-5 .1s-2.2.3-3 .5c-1.1.4-2 1-2.8 1.8s-1.4 1.7-1.8 2.8c-.2.8-.4 1.7-.5 3s-.1 1.7-.1 5 0 3.7.1 5 .3 2.2.5 3c.4 1.1 1 2 1.8 2.8s1.7 1.4 2.8 1.8c.8.2 1.7.4 3 .5s1.7.1 5 .1 3.7 0 5-.1 2.2-.3 3-.5c1.1-.4 2-1 2.8-1.8s1.4-1.7 1.8-2.8c.2-.8.4-1.7.5-3s.1-1.7.1-5 0-3.7-.1-5-.3-2.2-.5-3c-.4-1.1-1-2-1.8-2.8s-1.7-1.4-2.8-1.8c-.8-.2-1.7-.4-3-.5s-1.7-.1-5-.1z"/>
                      <circle cx="12" cy="12" r="3.2"/>
                      <circle cx="18.4" cy="5.6" r="1.3"/>
                    </svg>
                  </a>
                }
                @if (profileData()?.social?.youtubeIdUrl) {
                  <a [href]="profileData()?.social?.youtubeIdUrl" target="_blank"
                     class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                       'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                     }" aria-label="YouTube">
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </a>
                }
                @if (profileData()?.social?.externalLinkUrl) {
                  <a [href]="profileData()?.social?.externalLinkUrl" target="_blank"
                     class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                       'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                     }" aria-label="External Link">
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3"/>
                    </svg>
                  </a>
                }
                @if (profileData()?.social?.addLinkUrl) {
                  <a [href]="profileData()?.social?.addLinkUrl" target="_blank"
                     class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                     [ngClass]="{
                       'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20': isActor(),
                       'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                     }" aria-label="Additional Link">
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </a>
                }
              </div>
            </div>
          }
        </section>

        <!-- Right: Details -->
        <section class="space-y-4 sm:space-y-6">
          <!-- Actor Sections -->
          @if (isActor()) {
            <!-- Education and Experience -->
            <div class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
                 [ngClass]="{
                   'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                   'bg-black/50 ring-2 ring-white/10 border border-neutral-800': !isActor()
                 }">
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                <!-- Location -->
                <div>
                  <dt class="text-xs uppercase tracking-wide"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">location</dt>
                  <dd class="text-sm"
                      [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">{{ profileData()?.location || 'Not specified' }}</dd>
                </div>

                <!-- Education -->
                <div class="sm:col-span-1">
                  <dt class="text-xs uppercase tracking-wide"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">education</dt>
                  @if (hasEducation()) {
                    <dd class="mt-1 space-y-2">
                      @for (edu of profileData()?.actorProfile?.listEducation; track edu) {
                        <div class="text-sm"
                             [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">
                          <div class="font-medium">{{ edu.courseName }}</div>
                          <div class="text-xs"
                               [ngClass]="{'text-purple-200/60': isActor(), 'text-neutral-400': !isActor()}">
                            {{ edu.schoolName }} • {{ edu.yearCompleted }}
                          </div>
                          @if (edu.certificateUrl) {
                            <a [href]="edu.certificateUrl" target="_blank" 
                               class="text-xs hover:underline transition-colors duration-300"
                               [ngClass]="{'text-purple-300/60': isActor(), 'text-fuchsia-300': !isActor()}">
                              view certificate
                            </a>
                          }
                        </div>
                      }
                    </dd>
                  } @else {
                    <dd class="text-sm"
                        [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">No education added</dd>
                  }
                </div>

                <!-- Experience -->
                <div class="sm:col-span-2">
                  <dt class="text-xs uppercase tracking-wide"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">experience</dt>
                  @if (hasActorWorks()) {
                    <dd class="mt-1 space-y-3 md:space-y-4">
                      @for (work of profileData()?.actorProfile?.actorWorks; track work) {
                        <div class="p-2 sm:p-3 rounded-lg transition-colors duration-200"
                             [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                          <div class="text-sm font-medium"
                               [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">{{ work.projectName }}</div>
                          <div class="text-xs"
                               [ngClass]="{'text-purple-200/60': isActor(), 'text-neutral-400': !isActor()}">
                            {{ work.genre || 'Role not specified' }} • {{ work.year }}
                          </div>
                        </div>
                      }
                    </dd>
                  } @else {
                    <dd class="text-sm"
                        [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">No experience added</dd>
                  }
                </div>
              </dl>
            </div>

            <!-- Languages and Skills -->
            <div class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
                 [ngClass]="{
                   'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                   'bg-black/50 ring-2 ring-white/10 border border-neutral-800': !isActor()
                 }">
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                <!-- Languages -->
                <div>
                  <dt class="text-xs uppercase tracking-wide mb-2"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">languages</dt>
                  @if (hasLanguages()) {
                    <dd class="text-sm space-y-2 mt-1"
                        [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">
                      @for (language of profileData()?.actorProfile?.languages; track language) {
                        <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                             [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                          <span>{{ language }}</span>
                        </div>
                      }
                    </dd>
                  } @else {
                    <dd class="text-sm"
                        [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">No languages added</dd>
                  }
                </div>

                <!-- Skills -->
                <div>
                  <dt class="text-xs uppercase tracking-wide mb-2"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">skills</dt>
                  @if (hasSkills()) {
                    <dd class="text-sm space-y-2 mt-1"
                        [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">
                      @for (skill of profileData()?.actorProfile?.skills; track skill) {
                        <div class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                             [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                          <span>{{ skill }}</span>
                        </div>
                      }
                    </dd>
                  } @else {
                    <dd class="text-sm"
                        [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">No skills added</dd>
                  }
                </div>
              </dl>
            </div>
          }

          <!-- Producer Sections -->
          @if (!isActor()) {
            <!-- Profile Info -->
            <div class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
                 [ngClass]="{
                   'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                   'bg-black/50 ring-2 ring-white/10 border border-neutral-800': !isActor()
                 }">
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                <!-- Location -->
                <div>
                  <dt class="text-xs uppercase tracking-wide"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">location</dt>
                  <dd class="text-sm"
                      [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">{{ profileData()?.location || 'Not specified' }}</dd>
                </div>

                <!-- Designation -->
                <div>
                  <dt class="text-xs uppercase tracking-wide"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">designation</dt>
                  <dd class="text-sm"
                      [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">{{ profileData()?.producerProfile?.designation || 'Not specified' }}</dd>
                </div>

                <!-- Production House -->
                <div>
                  <dt class="text-xs uppercase tracking-wide"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">production house</dt>
                  <dd class="text-sm"
                      [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">{{ profileData()?.producerProfile?.productionHouse || 'Not specified' }}</dd>
                </div>

                <!-- Industry Type -->
                <div>
                  <dt class="text-xs uppercase tracking-wide"
                      [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">industry type</dt>
                  <dd class="text-sm"
                      [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">{{ profileData()?.producerProfile?.industryType || 'Not specified' }}</dd>
                </div>
              </dl>
            </div>

            <!-- Previous/Recent Works -->
            <div class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
                 [ngClass]="{
                   'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10': isActor(),
                   'bg-black/50 ring-2 ring-white/10 border border-neutral-800': !isActor()
                 }">
              <dl>
                <dt class="text-xs uppercase tracking-wide"
                    [ngClass]="{'text-purple-300/50': isActor(), 'text-neutral-500': !isActor()}">previous works</dt>
                @if (hasProducerWorks()) {
                  <dd class="mt-1 space-y-3 md:space-y-4">
                    @for (work of profileData()?.producerProfile?.producerWorks; track work) {
                      <div class="p-2 sm:p-3 rounded-lg transition-colors duration-200"
                           [ngClass]="{'hover:bg-purple-950/10': isActor(), 'hover:bg-white/5': !isActor()}">
                        <div class="text-sm font-medium"
                             [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">{{ work.projectName }}</div>
                        <div class="text-xs"
                             [ngClass]="{'text-purple-200/60': isActor(), 'text-neutral-400': !isActor()}">
                          {{ work.genre || 'Genre not specified' }} • {{ work.year }}
                        </div>
                      </div>
                    }
                  </dd>
                } @else {
                  <dd class="text-sm"
                      [ngClass]="{'text-purple-100/80': isActor(), 'text-neutral-200': !isActor()}">No previous works added</dd>
                }
              </dl>
            </div>
          }
        </section>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <app-edit-profile-modal 
      [isOpen]="isEditModalOpen()"
      [profile]="profileData()"
      [isActor]="isActor()"
      (close)="closeEditModal()"
      (save)="onProfileUpdated($event)">
    </app-edit-profile-modal>
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
  
  // User role and profile data signals
  userRole = signal<string>('actor');
  profileData = signal<Profile | null>(null);
  isActor = computed(() => this.userRole() === 'actor');
  
  // Modal state
  isEditModalOpen = signal(false);
  profileTheme = computed(() => this.isActor() ? 'actor-theme' : '');
  
  // Computed properties for safe array access
  hasCarouselImages = computed(() => {
    const profile = this.profileData();
    return profile?.actorProfile?.carouselImagesUrl && profile.actorProfile.carouselImagesUrl.length > 0;
  });
  
  hasEducation = computed(() => {
    const profile = this.profileData();
    return profile?.actorProfile?.listEducation && profile.actorProfile.listEducation.length > 0;
  });
  
  hasActorWorks = computed(() => {
    const profile = this.profileData();
    return profile?.actorProfile?.actorWorks && profile.actorProfile.actorWorks.length > 0;
  });
  
  hasLanguages = computed(() => {
    const profile = this.profileData();
    return profile?.actorProfile?.languages && profile.actorProfile.languages.length > 0;
  });
  
  hasSkills = computed(() => {
    const profile = this.profileData();
    return profile?.actorProfile?.skills && profile.actorProfile.skills.length > 0;
  });
  
  hasProducerWorks = computed(() => {
    const profile = this.profileData();
    return profile?.producerProfile?.producerWorks && profile.producerProfile.producerWorks.length > 0;
  });
  
  hasSocialLinks = computed(() => {
    const profile = this.profileData();
    return profile?.social && (
      profile.social.instaIdUrl ||
      profile.social.youtubeIdUrl ||
      profile.social.externalLinkUrl ||
      profile.social.addLinkUrl
    );
  });
  
  ngOnInit() {
    this.loadUserProfile();
  }
  
  private async loadUserProfile() {
    const user = this.auth.getCurrentUser();
    if (user) {
      try {
        // Load user role from UserDoc
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          this.userRole.set(userData.currentRole || 'actor');
        }

        // Load profile data
        const profileDocRef = doc(this.firestore, 'profiles', user.uid);
        const profileDoc = await getDoc(profileDocRef);
        if (profileDoc.exists()) {
          const profile = profileDoc.data() as Profile;
          this.profileData.set(profile);
        } else {
          // Profile doesn't exist, try to migrate
          console.log('Profile not found, attempting migration...');
          try {
            await this.auth.migrateUserProfile(user.uid);
            // Retry loading profile after migration
            const migratedProfileDoc = await getDoc(profileDocRef);
            if (migratedProfileDoc.exists()) {
              const profile = migratedProfileDoc.data() as Profile;
              this.profileData.set(profile);
              console.log('Profile migration successful');
            }
          } catch (migrationError) {
            console.error('Profile migration failed:', migrationError);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Default to actor if there's an error
        this.userRole.set('actor');
      }
    }
  }
  
  getDisplayName(): string {
    const profile = this.profileData();
    if (!profile) return 'User';
    
    if (this.isActor()) {
      return profile.actorProfile?.stageName || 'Actor';
    } else {
      return profile.producerProfile?.name || 'Producer';
    }
  }
  
  getProfileImageUrl(): string | null {
    const profile = this.profileData();
    if (!profile) return null;
    
    if (this.isActor()) {
      return profile.actorProfile?.actorProfileImageUrl || null;
    } else {
      return profile.producerProfile?.producerProfileImageUrl || null;
    }
  }
  
  getShortLocation(): string {
    const location = this.profileData()?.location;
    if (!location) return '';
    
    // Return first part of location or truncate if too long
    const parts = location.split(',');
    return parts[0].length > 10 ? parts[0].substring(0, 10) + '...' : parts[0];
  }
  
  playVoiceIntro() {
    const voiceIntroUrl = this.profileData()?.actorProfile?.voiceIntro;
    if (voiceIntroUrl) {
      // Create and play audio element
      const audio = new Audio(voiceIntroUrl);
      audio.play().catch(error => {
        console.error('Error playing voice intro:', error);
      });
    }
  }
  
  // Modal methods
  openEditModal() {
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
  }

  onProfileUpdated(updatedProfile: Profile) {
    this.profileData.set(updatedProfile);
    this.closeEditModal();
  }

  navigateToSettings() {
    this.router.navigate(['/discover/settings']);
  }
}
