import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import {
  Storage,
  ref,
  listAll,
  getDownloadURL,
} from '@angular/fire/storage';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { Profile, Language, Skill } from '../../assets/interfaces/profile.interfaces';

@Component({
  selector: 'app-discover-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 md:py-6"
      [ngClass]="profileTheme()"
    >
      <div
        class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 md:gap-8 lg:gap-10"
      >
        <!-- Left: Profile card + media -->
        <section class="space-y-5">
          <!-- Profile card (role-based theming) -->
          <div
            class="rounded-2xl p-5 transition-all duration-300"
            [ngClass]="{
              'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10':
                isActor(),
              'bg-black/50 ring-2 ring-white/10 border border-neutral-800':
                !isActor()
            }"
          >
            <div class="flex items-start gap-4">
              <!-- Profile image -->
              <div class="relative h-20 w-20 sm:h-24 sm:w-24 group">
                <div
                  class="absolute inset-0 rounded-full overflow-hidden transition-all duration-300"
                  [ngClass]="{
                    'ring-1 ring-purple-900/20': isActor(),
                    'ring-1 ring-white/15': !isActor()
                  }"
                >
                  @if (getProfileImageUrl()) {
                  <img
                    [src]="getProfileImageUrl()"
                    [alt]="getDisplayName()"
                    class="w-full h-full object-cover"
                  />
                  <!-- Remove profile picture button on hover -->
                  <button
                    (click)="removeProfilePicture()"
                    class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                    aria-label="Remove profile picture"
                  >
                    <svg
                      class="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  } @else {
                  <button
                    (click)="onDummyProfileClick()"
                    class="w-full h-full rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer hover:bg-opacity-80"
                    [ngClass]="{
                      'bg-purple-950/20 hover:bg-purple-950/30': isActor(),
                      'bg-white/10 hover:bg-white/15': !isActor()
                    }"
                    aria-label="Set profile picture"
                  >
                    <svg
                      class="w-10 h-10 sm:w-12 sm:h-12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      [ngClass]="{
                        'text-purple-300/40': isActor(),
                        'text-neutral-400': !isActor()
                      }"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </button>
                  }
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h1
                    class="text-lg sm:text-xl font-semibold"
                    [ngClass]="{
                      'text-purple-100/90': isActor(),
                      'text-neutral-100': !isActor()
                    }"
                  >
                    {{ getDisplayName() }}
                  </h1>
                  <span
                    class="px-2 py-0.5 text-[11px] rounded-full ring-1 transition-all duration-300"
                    [ngClass]="{
                      'ring-purple-900/20 bg-purple-950/20 text-purple-300/70':
                        isActor(),
                      'ring-emerald-500/30 bg-emerald-500/10 text-emerald-300':
                        !isActor()
                    }"
                    >{{ userRole() }}</span
                  >

                  @if (isActor() && profileData()?.actorProfile?.voiceIntro) {
                  <div class="flex items-center gap-1">
                    <button
                      class="h-7 w-7 rounded-full ring-1 transition-all duration-200 grid place-items-center"
                      [ngClass]="{
                        'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                          isActor(),
                        'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                      }"
                      [attr.aria-label]="isVoicePlaying() ? 'pause voice intro' : 'play voice intro'"
                      (click)="toggleVoiceIntro()"
                    >
                      @if (isVoicePlaying()) {
                      <!-- Pause icon -->
                      <svg
                        viewBox="0 0 24 24"
                        class="h-4 w-4"
                        [ngClass]="{
                          'text-purple-300/60': isActor(),
                          'text-neutral-300': !isActor()
                        }"
                      >
                        <path fill="currentColor" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                      } @else {
                      <!-- Play icon -->
                      <svg
                        viewBox="0 0 24 24"
                        class="h-4 w-4"
                        [ngClass]="{
                          'text-purple-300/60': isActor(),
                          'text-neutral-300': !isActor()
                        }"
                      >
                        <path fill="currentColor" d="M8 5v14l11-7z" />
                      </svg>
                      }
                    </button>
                    @if (isVoicePlaying()) {
                    <button
                      class="h-7 w-7 rounded-full ring-1 transition-all duration-200 grid place-items-center"
                      [ngClass]="{
                        'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                          isActor(),
                        'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                      }"
                      aria-label="stop voice intro"
                      (click)="stopVoiceIntro()"
                    >
                      <!-- Stop icon -->
                      <svg
                        viewBox="0 0 24 24"
                        class="h-4 w-4"
                        [ngClass]="{
                          'text-purple-300/60': isActor(),
                          'text-neutral-300': !isActor()
                        }"
                      >
                        <path fill="currentColor" d="M6 6h12v12H6z" />
                      </svg>
                    </button>
                    }
                  </div>
                  }

                  <button
                    class="h-6 w-6 grid place-items-center rounded-full ring-1 transition-all duration-200"
                    [ngClass]="{
                      'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                        isActor(),
                      'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                    }"
                    aria-label="edit"
                    (click)="openEditProfile()"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="h-3.5 w-3.5"
                      [ngClass]="{
                        'text-purple-300/60': isActor(),
                        'text-neutral-300': !isActor()
                      }"
                    >
                      <path
                        fill="currentColor"
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Basic info grid - different for Actor vs Producer -->
                @if (isActor()) {
                <!-- Actor basic info -->
                <div
                  class="mt-3 grid grid-cols-4 gap-2 text-[11px]"
                  [ngClass]="{
                    'text-purple-200/70': isActor(),
                    'text-neutral-300': !isActor()
                  }"
                >
                  @if (profileData()?.gender) {
                  <div
                    class="rounded-md px-2 py-1 text-center transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                      'bg-white/5 ring-1 ring-white/10': !isActor()
                    }"
                  >
                    {{ profileData()?.gender }}
                    <span class="opacity-60">gender</span>
                  </div>
                  } @if (profileData()?.actorProfile?.height) {
                  <div
                    class="rounded-md px-2 py-1 text-center transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                      'bg-white/5 ring-1 ring-white/10': !isActor()
                    }"
                  >
                    {{ profileData()?.actorProfile?.height }}
                    <span class="opacity-60">height</span>
                  </div>
                  } @if (profileData()?.actorProfile?.weight) {
                  <div
                    class="rounded-md px-2 py-1 text-center transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                      'bg-white/5 ring-1 ring-white/10': !isActor()
                    }"
                  >
                    {{ profileData()?.actorProfile?.weight }}
                    <span class="opacity-60">weight</span>
                  </div>
                  } @if (profileData()?.location) {
                  <div
                    class="rounded-md px-2 py-1 text-center transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                      'bg-white/5 ring-1 ring-white/10': !isActor()
                    }"
                  >
                    {{ getShortLocation() }}
                    <span class="opacity-60">location</span>
                  </div>
                  }
                </div>
                } @else {
                <!-- Producer basic info -->
                <div
                  class="mt-3 grid grid-cols-3 gap-2 text-[11px]"
                  [ngClass]="{
                    'text-purple-200/70': isActor(),
                    'text-neutral-300': !isActor()
                  }"
                >
                  @if (profileData()?.age) {
                  <div
                    class="rounded-md px-2 py-1 text-center transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                      'bg-white/5 ring-1 ring-white/10': !isActor()
                    }"
                  >
                    {{ profileData()?.age }} <span class="opacity-60">age</span>
                  </div>
                  } @if (profileData()?.gender) {
                  <div
                    class="rounded-md px-2 py-1 text-center transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                      'bg-white/5 ring-1 ring-white/10': !isActor()
                    }"
                  >
                    {{ profileData()?.gender }}
                    <span class="opacity-60">gender</span>
                  </div>
                  } @if (profileData()?.location) {
                  <div
                    class="rounded-md px-2 py-1 text-center transition-all duration-200"
                    [ngClass]="{
                      'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                      'bg-white/5 ring-1 ring-white/10': !isActor()
                    }"
                  >
                    {{ getShortLocation() }}
                    <span class="opacity-60">location</span>
                  </div>
                  }
                </div>
                }
              </div>
              <!-- tiny action icons -->
              <div
                class="flex flex-col items-center gap-2"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-400': !isActor()
                }"
              >
                <button
                  class="h-7 w-7 rounded-full ring-1 transition-all duration-200"
                  [ngClass]="{
                    'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                      isActor(),
                    'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                  }"
                  aria-label="options"
                ></button>
              </div>
            </div>
          </div>

          <!-- Media tabs - Actor only -->
          @if (isActor()) {
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full p-1 transition-all duration-300"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10': isActor(),
                'bg-white/5 ring-1 ring-white/10': !isActor()
              }"
            >
              <button
                class="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                [ngClass]="{
                  'bg-purple-900/20 text-purple-200':
                    mediaTab === 'videos' && isActor(),
                  'text-purple-300/60': mediaTab !== 'videos' && isActor(),
                  'bg-white/10 text-neutral-100':
                    mediaTab === 'videos' && !isActor(),
                  'text-neutral-400': mediaTab !== 'videos' && !isActor()
                }"
                (click)="mediaTab = 'videos'"
              >
                videos
              </button>
              <button
                class="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                [ngClass]="{
                  'bg-purple-900/20 text-purple-200':
                    mediaTab === 'photos' && isActor(),
                  'text-purple-300/60': mediaTab !== 'photos' && isActor(),
                  'bg-white/10 text-neutral-100':
                    mediaTab === 'photos' && !isActor(),
                  'text-neutral-400': mediaTab !== 'photos' && !isActor()
                }"
                (click)="mediaTab = 'photos'"
              >
                photos
              </button>
            </div>

            <!-- Videos Tab Content -->
            @if (mediaTab === 'videos') { @if (hasVideos()) {
            <div
              class="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              @for (videoUrl of videoUrls(); track videoUrl) {
              <div
                class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 cursor-pointer group"
                [ngClass]="{
                  'ring-purple-900/10 hover:ring-purple-900/20': isActor(),
                  'ring-white/10 hover:ring-white/20': !isActor()
                }"
                (click)="openPreviewModal(videoUrl, 'video')"
              >
                <video
                  [src]="videoUrl"
                  class="w-full h-full object-cover pointer-events-none"
                ></video>
                <div
                  class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                >
                  <svg
                    class="h-12 w-12 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              }
              <!-- Add more videos button -->
              <button
                (click)="navigateToUpload()"
                class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 flex flex-col items-center justify-center gap-2"
                [ngClass]="{
                  'ring-purple-900/10 bg-purple-950/5 hover:bg-purple-900/10':
                    isActor(),
                  'ring-white/10 bg-neutral-800/30 hover:bg-neutral-700/40':
                    !isActor()
                }"
              >
                <svg
                  class="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  [ngClass]="{
                    'text-purple-300/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-200/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  Add More
                </span>
              </button>
            </div>
            } @else {
            <!-- Add video button -->
            <div class="mt-3">
              <button
                (click)="navigateToUpload()"
                class="w-full aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 flex flex-col items-center justify-center gap-2"
                [ngClass]="{
                  'ring-purple-900/10 bg-gradient-to-br from-purple-950/20 to-purple-900/10 hover:bg-purple-900/20':
                    isActor(),
                  'ring-white/10 bg-neutral-800/50 hover:bg-neutral-700/50':
                    !isActor()
                }"
              >
                <svg
                  class="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  [ngClass]="{
                    'text-purple-300/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-200/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  Add Video
                </span>
              </button>
            </div>
            } }

            <!-- Photos Tab Content -->
            @if (mediaTab === 'photos') { @if (hasImages()) {
            <div
              class="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              @for (imageUrl of imageUrls(); track imageUrl) {
              <div
                class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 cursor-pointer group"
                [ngClass]="{
                  'ring-purple-900/10 hover:ring-purple-900/20': isActor(),
                  'ring-white/10 hover:ring-white/20': !isActor()
                }"
                (click)="openPreviewModal(imageUrl, 'image')"
              >
                <img
                  [src]="imageUrl"
                  alt="Portfolio image"
                  class="w-full h-full object-cover"
                />
                <div
                  class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                >
                  <svg
                    class="h-8 w-8 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
              }
              <!-- Add more images button -->
              <button
                (click)="navigateToUpload()"
                class="aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 flex flex-col items-center justify-center gap-2"
                [ngClass]="{
                  'ring-purple-900/10 bg-purple-950/5 hover:bg-purple-900/10':
                    isActor(),
                  'ring-white/10 bg-neutral-800/30 hover:bg-neutral-700/40':
                    !isActor()
                }"
              >
                <svg
                  class="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  [ngClass]="{
                    'text-purple-300/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-200/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  Add More
                </span>
              </button>
            </div>
            } @else {
            <!-- Add image button -->
            <div class="mt-3">
              <button
                (click)="navigateToUpload()"
                class="w-full aspect-video rounded-lg ring-1 relative overflow-hidden transition-all duration-200 flex flex-col items-center justify-center gap-2"
                [ngClass]="{
                  'ring-purple-900/10 bg-gradient-to-br from-purple-950/20 to-purple-900/10 hover:bg-purple-900/20':
                    isActor(),
                  'ring-white/10 bg-neutral-800/50 hover:bg-neutral-700/50':
                    !isActor()
                }"
              >
                <svg
                  class="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  [ngClass]="{
                    'text-purple-300/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-200/60': isActor(),
                    'text-neutral-400': !isActor()
                  }"
                >
                  Add Image
                </span>
              </button>
            </div>
            } }
          </div>
          }

          <!-- Social links -->
          @if (hasSocialLinks() || isActor()) {
          <div class="mt-4">
            <div
              class="text-xs mb-2 transition-colors duration-300"
              [ngClass]="{
                'text-purple-300/50': isActor(),
                'text-neutral-500': !isActor()
              }"
            >
              social links
            </div>
            <div class="flex items-center gap-3">
              @if (profileData()?.social?.instaIdUrl) {
              <a
                [href]="profileData()?.social?.instaIdUrl"
                target="_blank"
                class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                [ngClass]="{
                  'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                    isActor(),
                  'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                }"
                aria-label="Instagram"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              } @if (profileData()?.social?.youtubeIdUrl) {
              <a
                [href]="profileData()?.social?.youtubeIdUrl"
                target="_blank"
                class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                [ngClass]="{
                  'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                    isActor(),
                  'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                }"
                aria-label="YouTube"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                  />
                </svg>
              </a>
              } @if (profileData()?.social?.externalLinkUrl) {
              <a
                [href]="profileData()?.social?.externalLinkUrl"
                target="_blank"
                class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                [ngClass]="{
                  'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                    isActor(),
                  'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                }"
                aria-label="External Link"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                  />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              } @if (profileData()?.social?.addLinkUrl) {
              <a
                [href]="profileData()?.social?.addLinkUrl"
                target="_blank"
                class="h-7 w-7 rounded-full ring-1 transition-all duration-200 flex items-center justify-center"
                [ngClass]="{
                  'ring-purple-900/15 bg-purple-950/10 hover:bg-purple-900/20':
                    isActor(),
                  'ring-white/10 bg-white/5 hover:bg-white/10': !isActor()
                }"
                aria-label="Additional Link"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  />
                  <path
                    d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  />
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
          <div
            class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
            [ngClass]="{
              'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10':
                isActor(),
              'bg-black/50 ring-2 ring-white/10 border border-neutral-800':
                !isActor()
            }"
          >
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
              <!-- Location -->
              <div>
                <dt
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  location
                </dt>
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  {{ profileData()?.location || 'Not specified' }}
                </dd>
              </div>

              <!-- Education -->
              <div class="sm:col-span-1">
                <dt
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  education
                </dt>
                @if (hasEducation()) {
                <dd class="mt-1 space-y-2">
                  @for (edu of profileData()?.actorProfile?.listEducation; track
                  edu) {
                  <div
                    class="text-sm"
                    [ngClass]="{
                      'text-purple-100/80': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    <div class="font-medium">{{ edu.courseName }}</div>
                    <div
                      class="text-xs"
                      [ngClass]="{
                        'text-purple-200/60': isActor(),
                        'text-neutral-400': !isActor()
                      }"
                    >
                      {{ edu.schoolName }} • {{ edu.yearCompleted }}
                    </div>
                    @if (edu.certificateUrl) {
                    <a
                      [href]="edu.certificateUrl"
                      target="_blank"
                      class="text-xs hover:underline transition-colors duration-300"
                      [ngClass]="{
                        'text-purple-300/60': isActor(),
                        'text-fuchsia-300': !isActor()
                      }"
                    >
                      view certificate
                    </a>
                    }
                  </div>
                  }
                </dd>
                } @else {
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  No education added
                </dd>
                }
              </div>

              <!-- Experience -->
              <div class="sm:col-span-2">
                <dt
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  experience
                </dt>
                @if (hasActorWorks()) {
                <dd class="mt-1 space-y-3 md:space-y-4">
                  @for (work of profileData()?.actorProfile?.actorWorks; track
                  work) {
                  <div
                    class="p-2 sm:p-3 rounded-lg transition-colors duration-200"
                    [ngClass]="{
                      'hover:bg-purple-950/10': isActor(),
                      'hover:bg-white/5': !isActor()
                    }"
                  >
                    <div
                      class="text-sm font-medium"
                      [ngClass]="{
                        'text-purple-100/80': isActor(),
                        'text-neutral-200': !isActor()
                      }"
                    >
                      {{ work.projectName }}
                    </div>
                    <div
                      class="text-xs"
                      [ngClass]="{
                        'text-purple-200/60': isActor(),
                        'text-neutral-400': !isActor()
                      }"
                    >
                      {{ work.genre || 'Role not specified' }} • {{ work.year }}
                    </div>
                  </div>
                  }
                </dd>
                } @else {
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  No experience added
                </dd>
                }
              </div>
            </dl>
          </div>

          <!-- Languages and Skills -->
          <div
            class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
            [ngClass]="{
              'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10':
                isActor(),
              'bg-black/50 ring-2 ring-white/10 border border-neutral-800':
                !isActor()
            }"
          >
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
              <!-- Languages -->
              <div>
                <dt
                  class="text-xs uppercase tracking-wide mb-2"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  languages
                </dt>
                @if (hasLanguages()) {
                <dd
                  class="text-sm space-y-2 mt-1"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  @for (language of profileData()?.actorProfile?.languages;
                  track language) {
                  <div
                    class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                    [ngClass]="{
                      'hover:bg-purple-950/10': isActor(),
                      'hover:bg-white/5': !isActor()
                    }"
                  >
                    <span>{{ getLanguageName(language) }}</span>
                    @if (hasLanguageRating(language)) {
                    <div class="flex items-center gap-1">
                      @for (star of [1,2,3,4,5]; track star) {
                      <svg 
                        class="w-3 h-3"
                        [ngClass]="{
                          'text-yellow-400': star <= getLanguageRating(language),
                          'text-gray-400': star > getLanguageRating(language)
                        }"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      }
                    </div>
                    }
                  </div>
                  }
                </dd>
                } @else {
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  No languages added
                </dd>
                }
              </div>

              <!-- Skills -->
              <div>
                <dt
                  class="text-xs uppercase tracking-wide mb-2"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  skills
                </dt>
                @if (hasSkills()) {
                <dd
                  class="text-sm space-y-2 mt-1"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  @for (skill of profileData()?.actorProfile?.skills; track
                  skill) {
                  <div
                    class="flex items-center justify-between gap-2 p-1.5 rounded-md transition-colors duration-200"
                    [ngClass]="{
                      'hover:bg-purple-950/10': isActor(),
                      'hover:bg-white/5': !isActor()
                    }"
                  >
                    <span>{{ getSkillName(skill) }}</span>
                    @if (hasSkillRating(skill)) {
                    <div class="flex items-center gap-1">
                      @for (star of [1,2,3,4,5]; track star) {
                      <svg 
                        class="w-3 h-3"
                        [ngClass]="{
                          'text-yellow-400': star <= getSkillRating(skill),
                          'text-gray-400': star > getSkillRating(skill)
                        }"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      }
                    </div>
                    }
                  </div>
                  }
                </dd>
                } @else {
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  No skills added
                </dd>
                }
              </div>
            </dl>
          </div>
          }

          <!-- Producer Sections -->
          @if (!isActor()) {
          <!-- Profile Info -->
          <div
            class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
            [ngClass]="{
              'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10':
                isActor(),
              'bg-black/50 ring-2 ring-white/10 border border-neutral-800':
                !isActor()
            }"
          >
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
              <!-- Location -->
              <div>
                <dt
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  location
                </dt>
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  {{ profileData()?.location || 'Not specified' }}
                </dd>
              </div>

              <!-- Designation -->
              <div>
                <dt
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  designation
                </dt>
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  {{
                    profileData()?.producerProfile?.designation ||
                      'Not specified'
                  }}
                </dd>
              </div>

              <!-- Production House -->
              <div>
                <dt
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  production house
                </dt>
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  {{
                    profileData()?.producerProfile?.productionHouse ||
                      'Not specified'
                  }}
                </dd>
              </div>

              <!-- Industry Type -->
              <div>
                <dt
                  class="text-xs uppercase tracking-wide"
                  [ngClass]="{
                    'text-purple-300/50': isActor(),
                    'text-neutral-500': !isActor()
                  }"
                >
                  industry type
                </dt>
                <dd
                  class="text-sm"
                  [ngClass]="{
                    'text-purple-100/80': isActor(),
                    'text-neutral-200': !isActor()
                  }"
                >
                  {{
                    profileData()?.producerProfile?.industryType ||
                      'Not specified'
                  }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Previous/Recent Works -->
          <div
            class="rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300"
            [ngClass]="{
              'bg-purple-950/10 ring-1 ring-purple-900/10 border border-purple-950/10':
                isActor(),
              'bg-black/50 ring-2 ring-white/10 border border-neutral-800':
                !isActor()
            }"
          >
            <dl>
              <dt
                class="text-xs uppercase tracking-wide"
                [ngClass]="{
                  'text-purple-300/50': isActor(),
                  'text-neutral-500': !isActor()
                }"
              >
                previous works
              </dt>
              @if (hasProducerWorks()) {
              <dd class="mt-1 space-y-3 md:space-y-4">
                @for (work of profileData()?.producerProfile?.producerWorks;
                track work) {
                <div
                  class="p-2 sm:p-3 rounded-lg transition-colors duration-200"
                  [ngClass]="{
                    'hover:bg-purple-950/10': isActor(),
                    'hover:bg-white/5': !isActor()
                  }"
                >
                  <div
                    class="text-sm font-medium"
                    [ngClass]="{
                      'text-purple-100/80': isActor(),
                      'text-neutral-200': !isActor()
                    }"
                  >
                    {{ work.projectName }}
                  </div>
                  <div
                    class="text-xs"
                    [ngClass]="{
                      'text-purple-200/60': isActor(),
                      'text-neutral-400': !isActor()
                    }"
                  >
                    {{ work.genre || 'Genre not specified' }} • {{ work.year }}
                  </div>
                </div>
                }
              </dd>
              } @else {
              <dd
                class="text-sm"
                [ngClass]="{
                  'text-purple-100/80': isActor(),
                  'text-neutral-200': !isActor()
                }"
              >
                No previous works added
              </dd>
              }
            </dl>
          </div>
          }
        </section>
      </div>
    </div>

    <!-- Media Preview Modal -->
    @if (isPreviewModalOpen()) {
    <div
      class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      (click)="closePreviewModal()"
    >
      <div
        class="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
        (click)="$event.stopPropagation()"
      >
        <!-- Close button -->
        <button
          (click)="closePreviewModal()"
          class="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors ring-1 ring-white/20"
          aria-label="Close preview"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Set as Profile Picture button (only for images) -->
        @if (previewMediaType() === 'image') {
        <button
          (click)="setAsProfilePicture(); $event.stopPropagation()"
          class="absolute top-4 left-4 z-10 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors ring-1 ring-white/20 flex items-center gap-2"
          aria-label="Set as profile picture"
        >
          <svg
            class="w-5 h-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span class="text-white text-sm">Set as Profile Picture</span>
        </button>
        }

        <!-- Previous button -->
        @if (canGoToPrevious()) {
        <button
          (click)="goToPreviousMedia(); $event.stopPropagation()"
          class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors ring-1 ring-white/20"
          aria-label="Previous media"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        }

        <!-- Next button -->
        @if (canGoToNext()) {
        <button
          (click)="goToNextMedia(); $event.stopPropagation()"
          class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors ring-1 ring-white/20"
          aria-label="Next media"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        }

        <!-- Media content -->
        <div class="w-full h-full flex items-center justify-center px-20">
          @if (previewMediaType() === 'image') {
          <img
            [src]="previewMediaUrl()"
            alt="Preview"
            class="max-w-full max-h-full object-contain rounded-lg"
          />
          } @else if (previewMediaType() === 'video') {
          <video
            [src]="previewMediaUrl()"
            class="max-w-full max-h-full object-contain rounded-lg"
            controls
            autoplay
          ></video>
          }
        </div>

        <!-- Counter indicator -->
        <div
          class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/50 rounded-full text-white text-sm ring-1 ring-white/20"
        >
          {{ currentMediaIndex() + 1 }} / {{ currentMediaList().length }}
        </div>
      </div>
    </div>
    }
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
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private router = inject(Router);

  mediaTab: 'videos' | 'photos' = 'videos';

  // User role and profile data signals
  userRole = signal<string>('actor');
  profileData = signal<Profile | null>(null);
  isActor = computed(() => this.userRole() === 'actor');

  // Media signals
  videoUrls = signal<string[]>([]);
  imageUrls = signal<string[]>([]);
  isLoadingMedia = signal(false);

  // Modal state
  isPreviewModalOpen = signal(false);
  previewMediaUrl = signal<string | null>(null);
  previewMediaType = signal<'image' | 'video'>('image');
  currentMediaIndex = signal(0);
  profileTheme = computed(() => (this.isActor() ? 'actor-theme' : ''));

  // Computed for navigation
  currentMediaList = computed(() => {
    return this.previewMediaType() === 'video'
      ? this.videoUrls()
      : this.imageUrls();
  });

  canGoToPrevious = computed(() => this.currentMediaIndex() > 0);
  canGoToNext = computed(
    () => this.currentMediaIndex() < this.currentMediaList().length - 1
  );

  // Audio instance for voice intro
  private currentAudio: HTMLAudioElement | null = null;
  isVoicePlaying = signal(false);

  // Computed properties for safe array access
  hasCarouselImages = computed(() => {
    const profile = this.profileData();
    return (
      profile?.actorProfile?.carouselImagesUrl &&
      profile.actorProfile.carouselImagesUrl.length > 0
    );
  });

  hasVideos = computed(() => this.videoUrls().length > 0);
  hasImages = computed(() => this.imageUrls().length > 0);

  hasEducation = computed(() => {
    const profile = this.profileData();
    return (
      profile?.actorProfile?.listEducation &&
      profile.actorProfile.listEducation.length > 0
    );
  });

  hasActorWorks = computed(() => {
    const profile = this.profileData();
    return (
      profile?.actorProfile?.actorWorks &&
      profile.actorProfile.actorWorks.length > 0
    );
  });

  hasLanguages = computed(() => {
    const profile = this.profileData();
    return (
      profile?.actorProfile?.languages &&
      profile.actorProfile.languages.length > 0
    );
  });

  hasSkills = computed(() => {
    const profile = this.profileData();
    return (
      profile?.actorProfile?.skills && profile.actorProfile.skills.length > 0
    );
  });

  hasProducerWorks = computed(() => {
    const profile = this.profileData();
    return (
      profile?.producerProfile?.producerWorks &&
      profile.producerProfile.producerWorks.length > 0
    );
  });

  hasSocialLinks = computed(() => {
    const profile = this.profileData();
    return (
      profile?.social &&
      (profile.social.instaIdUrl ||
        profile.social.youtubeIdUrl ||
        profile.social.externalLinkUrl ||
        profile.social.addLinkUrl)
    );
  });

  ngOnInit() {
    this.loadUserProfile();
  }

  private async loadMediaFromStorage(userId: string) {
    this.isLoadingMedia.set(true);
    try {
      // Fetch videos
      const videosRef = ref(this.storage, `users/${userId}/videos`);
      const videosList = await listAll(videosRef);
      const videoUrlPromises = videosList.items.map((item) =>
        getDownloadURL(item)
      );
      const videos = await Promise.all(videoUrlPromises);
      this.videoUrls.set(videos);

      // Fetch images
      const imagesRef = ref(this.storage, `users/${userId}/images`);
      const imagesList = await listAll(imagesRef);
      const imageUrlPromises = imagesList.items.map((item) =>
        getDownloadURL(item)
      );
      const images = await Promise.all(imageUrlPromises);
      this.imageUrls.set(images);
    } catch (error) {
      // Set empty arrays if folders don't exist
      this.videoUrls.set([]);
      this.imageUrls.set([]);
    } finally {
      this.isLoadingMedia.set(false);
    }
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
          // Load media from storage
          await this.loadMediaFromStorage(user.uid);
        } else {
          // Profile doesn't exist, try to migrate
          try {
            await this.auth.migrateUserProfile(user.uid);
            // Retry loading profile after migration
            const migratedProfileDoc = await getDoc(profileDocRef);
            if (migratedProfileDoc.exists()) {
              const profile = migratedProfileDoc.data() as Profile;
              this.profileData.set(profile);
              // Load media from storage
              await this.loadMediaFromStorage(user.uid);
            }
          } catch (migrationError) {
            // Migration failed, continue without profile
          }
        }
      } catch (error) {
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

  toggleVoiceIntro() {
    const voiceIntroUrl = this.profileData()?.actorProfile?.voiceIntro;
    if (!voiceIntroUrl) return;

    // If audio is currently playing, pause it
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isVoicePlaying.set(false);
      return;
    }

    // If audio exists but is paused, resume it
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {
        this.isVoicePlaying.set(false);
        this.currentAudio = null;
      });
      this.isVoicePlaying.set(true);
      return;
    }

    // Create new audio element
    this.currentAudio = new Audio(voiceIntroUrl);
    
    // Cleanup when audio ends
    this.currentAudio.addEventListener('ended', () => {
      this.isVoicePlaying.set(false);
      this.currentAudio = null;
    });

    // Start playing
    this.currentAudio.play().catch(() => {
      this.isVoicePlaying.set(false);
      this.currentAudio = null;
    });
    
    this.isVoicePlaying.set(true);
  }

  stopVoiceIntro() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isVoicePlaying.set(false);
    }
  }

  // Helper method to get platform-specific icon
  getSocialIcon(url: string, platform: string): string {
    if (!url) return this.getDefaultLinkIcon();

    const lowerUrl = url.toLowerCase();

    // Instagram
    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
      return `<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0-2.2c-3.3 0-3.7 0-5 .1s-2.2.3-3 .5c-1.1.4-2 1-2.8 1.8s-1.4 1.7-1.8 2.8c-.2.8-.4 1.7-.5 3s-.1 1.7-.1 5 0 3.7.1 5 .3 2.2.5 3c.4 1.1 1 2 1.8 2.8s1.7 1.4 2.8 1.8c.8.2 1.7.4 3 .5s1.7.1 5 .1 3.7 0 5-.1 2.2-.3 3-.5c1.1-.4 2-1 2.8-1.8s1.4-1.7 1.8-2.8c.2-.8.4-1.7.5-3s.1-1.7.1-5 0-3.7-.1-5-.3-2.2-.5-3c-.4-1.1-1-2-1.8-2.8s-1.7-1.4-2.8-1.8c-.8-.2-1.7-.4-3-.5s-1.7-.1-5-.1z"/><circle cx="12" cy="12" r="3.2"/><circle cx="18.4" cy="5.6" r="1.3"/>`;
    }

    // YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return `<path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>`;
    }

    // Twitter/X
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`;
    }

    // LinkedIn
    if (lowerUrl.includes('linkedin.com')) {
      return `<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`;
    }

    // TikTok
    if (lowerUrl.includes('tiktok.com')) {
      return `<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>`;
    }

    // Facebook
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
      return `<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>`;
    }

    // Default link icon for unknown platforms
    return this.getDefaultLinkIcon();
  }

  private getDefaultLinkIcon(): string {
    return `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3"/>`;
  }

  // Helper method to get social platform name for aria-label
  getSocialPlatformName(url: string): string {
    if (!url) return 'External Link';

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am'))
      return 'Instagram';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be'))
      return 'YouTube';
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com'))
      return 'Twitter/X';
    if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
    if (lowerUrl.includes('tiktok.com')) return 'TikTok';
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com'))
      return 'Facebook';

    return 'External Link';
  }

  // Navigation methods
  openEditProfile() {
    this.router.navigate(['/discover/profile/edit']);
  }


  navigateToSettings() {
    this.router.navigate(['/discover/settings']);
  }

  navigateToUpload() {
    this.router.navigate(['/discover/upload']);
  }

  openPreviewModal(url: string, type: 'image' | 'video') {
    this.previewMediaUrl.set(url);
    this.previewMediaType.set(type);

    // Find the index of the current media in the appropriate list
    const mediaList = type === 'video' ? this.videoUrls() : this.imageUrls();
    const index = mediaList.indexOf(url);
    this.currentMediaIndex.set(index >= 0 ? index : 0);

    this.isPreviewModalOpen.set(true);
  }

  closePreviewModal() {
    this.isPreviewModalOpen.set(false);
    this.previewMediaUrl.set(null);
    this.currentMediaIndex.set(0);
  }

  goToPreviousMedia() {
    if (this.canGoToPrevious()) {
      const newIndex = this.currentMediaIndex() - 1;
      this.currentMediaIndex.set(newIndex);
      const mediaList = this.currentMediaList();
      this.previewMediaUrl.set(mediaList[newIndex]);
    }
  }

  goToNextMedia() {
    if (this.canGoToNext()) {
      const newIndex = this.currentMediaIndex() + 1;
      this.currentMediaIndex.set(newIndex);
      const mediaList = this.currentMediaList();
      this.previewMediaUrl.set(mediaList[newIndex]);
    }
  }

  async setAsProfilePicture() {
    const user = this.auth.getCurrentUser();
    if (!user || !this.previewMediaUrl()) return;

    const imageUrl = this.previewMediaUrl();
    if (!imageUrl) return;

    try {
      const profileDocRef = doc(this.firestore, 'profiles', user.uid);

      if (this.isActor()) {
        // Update actor profile image
        await updateDoc(profileDocRef, {
          'actorProfile.actorProfileImageUrl': imageUrl,
        });

        // Update local state
        const currentProfile = this.profileData();
        if (currentProfile?.actorProfile) {
          currentProfile.actorProfile.actorProfileImageUrl = imageUrl;
          this.profileData.set({ ...currentProfile });
        }
      } else {
        // Update producer profile image
        await updateDoc(profileDocRef, {
          'producerProfile.producerProfileImageUrl': imageUrl,
        });

        // Update local state
        const currentProfile = this.profileData();
        if (currentProfile?.producerProfile) {
          currentProfile.producerProfile.producerProfileImageUrl = imageUrl;
          this.profileData.set({ ...currentProfile });
        }
      }

      // Close the preview modal after setting
      this.closePreviewModal();
    } catch (error) {
      // Handle error silently
    }
  }

  onDummyProfileClick() {
    // Switch to photos tab
    this.mediaTab = 'photos';

    // If there are images, open the first one in preview
    if (this.hasImages()) {
      const firstImage = this.imageUrls()[0];
      this.openPreviewModal(firstImage, 'image');
    } else {
      // If no images, redirect to upload page with return URL
      this.router.navigate(['/discover/upload'], {
        queryParams: { returnUrl: '/discover/profile' }
      });
    }
  }

  async removeProfilePicture() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    try {
      const profileDocRef = doc(this.firestore, 'profiles', user.uid);

      if (this.isActor()) {
        // Remove actor profile image
        await updateDoc(profileDocRef, {
          'actorProfile.actorProfileImageUrl': null,
        });

        // Update local state
        const currentProfile = this.profileData();
        if (currentProfile?.actorProfile) {
          currentProfile.actorProfile.actorProfileImageUrl = undefined;
          this.profileData.set({ ...currentProfile });
        }
      } else {
        // Remove producer profile image
        await updateDoc(profileDocRef, {
          'producerProfile.producerProfileImageUrl': null,
        });

        // Update local state
        const currentProfile = this.profileData();
        if (currentProfile?.producerProfile) {
          currentProfile.producerProfile.producerProfileImageUrl = undefined;
          this.profileData.set({ ...currentProfile });
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }

  // Helper methods for template type checking
  getLanguageName(language: string | Language): string {
    return typeof language === 'string' ? language : language.language;
  }

  hasLanguageRating(language: string | Language): boolean {
    return typeof language === 'object' && language.rating !== undefined;
  }

  getLanguageRating(language: string | Language): number {
    return typeof language === 'object' ? language.rating : 0;
  }

  getSkillName(skill: string | Skill): string {
    return typeof skill === 'string' ? skill : skill.skill;
  }

  hasSkillRating(skill: string | Skill): boolean {
    return typeof skill === 'object' && skill.rating !== undefined;
  }

  getSkillRating(skill: string | Skill): number {
    return typeof skill === 'object' ? skill.rating : 0;
  }
}
