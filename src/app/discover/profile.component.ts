import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProfileUrlService } from '../services/profile-url.service';
import { ChatService } from '../services/chat.service';
import { AnalyticsService } from '../services/analytics.service';
import { BlockService } from '../services/block.service';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  collection,
  getDocs,
  limit,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { UserDoc } from '../../assets/interfaces/interfaces';
import {
  Profile,
  Language,
  Skill,
} from '../../assets/interfaces/profile.interfaces';

@Component({
  selector: 'app-discover-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-h-screen bg-transparent text-white relative"
      [ngClass]="{ 'actor-theme': isActorTheme() }"
      (click)="closeMenu(); closeShareMenu()"
    >
      <div class="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div class="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-6 lg:gap-8">
          <!-- Left: Profile card + media -->
          <section class="space-y-4">
            <!-- Profile card -->
            <div
              class="rounded-xl p-5 border relative backdrop-blur-xl"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10':
                  isActorTheme(),
                'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30':
                  !isActorTheme()
              }"
            >
              <!-- Settings Icon (top left, absolute) -->
              @if (isViewingOwnProfile()) {
              <button
                class="absolute top-4 left-4 h-8 w-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                aria-label="settings"
                (click)="navigateToSettings()"
              >
                <svg
                  class="h-4 w-4 text-neutral-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                  />
                </svg>
              </button>

              <!-- Edit Profile Icon (top right, absolute) -->
              <button
                class="absolute top-4 right-4 h-8 w-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                aria-label="edit profile"
                (click)="openEditProfile()"
              >
                <svg
                  class="h-4 w-4 text-neutral-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                  />
                </svg>
              </button>
              }

              <!-- Two-column layout: Profile Picture | Info -->
              <div class="grid grid-cols-[140px_1fr] gap-6 items-start pt-8">
                <!-- Left Column: Profile Picture -->
                <div class="relative group">
                  <div
                    class="h-32 w-32 rounded-full overflow-hidden ring-2 ring-neutral-700/50"
                  >
                    @if (getProfileImageUrl()) {
                    <button
                      (click)="viewProfilePicture()"
                      class="w-full h-full cursor-pointer"
                      aria-label="View profile picture"
                    >
                      <img
                        [src]="getProfileImageUrl()"
                        [alt]="getDisplayName()"
                        class="w-full h-full object-cover"
                      />
                    </button>
                    } @else if (isViewingOwnProfile()) {
                    <button
                      (click)="onDummyProfileClick()"
                      class="w-full h-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center cursor-pointer"
                      aria-label="Set profile picture"
                    >
                      <svg
                        class="w-12 h-12 text-neutral-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </button>
                    } @else {
                    <div
                      class="w-full h-full bg-neutral-800/50 flex items-center justify-center"
                    >
                      <svg
                        class="w-12 h-12 text-neutral-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    }
                  </div>
                </div>

                <!-- Right Column: Info -->
                <div class="space-y-3">
                  <!-- Name with Share Button -->
                  <div class="flex items-center gap-2 relative">
                    <h1
                      class="text-2xl font-medium text-neutral-200"
                      [ngClass]="{ 'pl-4': isActor() }"
                    >
                      {{ getDisplayName() }}
                    </h1>

                    <!-- Share Profile URL Button -->
                    <button
                      (click)="toggleShareMenu(); $event.stopPropagation()"
                      class="p-1.5 rounded-full bg-neutral-800/40 hover:bg-neutral-700/60 transition-colors flex items-center justify-center"
                      aria-label="Share profile"
                      title="Share profile"
                    >
                      <svg
                        class="w-4 h-4 text-neutral-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </button>

                    <!-- Share Menu Dropdown -->
                    @if (isShareMenuOpen()) {
                    <div
                      class="absolute top-full mt-2 left-0 bg-neutral-900 rounded-lg shadow-xl ring-1 ring-white/10 z-50 min-w-[220px] overflow-hidden"
                      (click)="$event.stopPropagation()"
                    >
                      <!-- Copy Link -->
                      <button
                        (click)="copyProfileUrl()"
                        class="w-full px-4 py-3 text-left text-white hover:bg-neutral-800 transition-colors flex items-center gap-3"
                      >
                        <svg
                          class="w-5 h-5 text-neutral-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span class="text-sm font-medium">Copy Link</span>
                      </button>

                      <!-- Divider -->
                      <div class="h-px bg-neutral-800"></div>

                      <!-- Twitter/X -->
                      <button
                        (click)="shareOnTwitter()"
                        class="w-full px-4 py-3 text-left text-white hover:bg-neutral-800 transition-colors flex items-center gap-3"
                      >
                        <svg
                          class="w-5 h-5 text-neutral-400"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                          />
                        </svg>
                        <span class="text-sm font-medium">Share on X</span>
                      </button>

                      <!-- Facebook -->
                      <button
                        (click)="shareOnFacebook()"
                        class="w-full px-4 py-3 text-left text-white hover:bg-neutral-800 transition-colors flex items-center gap-3"
                      >
                        <svg
                          class="w-5 h-5 text-neutral-400"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                          />
                        </svg>
                        <span class="text-sm font-medium"
                          >Share on Facebook</span
                        >
                      </button>

                      <!-- LinkedIn -->
                      <button
                        (click)="shareOnLinkedIn()"
                        class="w-full px-4 py-3 text-left text-white hover:bg-neutral-800 transition-colors flex items-center gap-3"
                      >
                        <svg
                          class="w-5 h-5 text-neutral-400"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                          />
                        </svg>
                        <span class="text-sm font-medium"
                          >Share on LinkedIn</span
                        >
                      </button>

                      <!-- WhatsApp -->
                      <button
                        (click)="shareOnWhatsApp()"
                        class="w-full px-4 py-3 text-left text-white hover:bg-neutral-800 transition-colors flex items-center gap-3"
                      >
                        <svg
                          class="w-5 h-5 text-neutral-400"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                          />
                        </svg>
                        <span class="text-sm font-medium"
                          >Share on WhatsApp</span
                        >
                      </button>
                    </div>
                    }
                  </div>

                  <!-- Voice Intro (if actor) -->
                  @if (isActor() && profileData()?.actorProfile?.voiceIntro) {
                  <div class="flex items-center gap-2">
                    <button
                      class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors"
                      [attr.aria-label]="
                        isVoicePlaying()
                          ? 'pause voice intro'
                          : 'play voice intro'
                      "
                      (click)="toggleVoiceIntro()"
                    >
                      @if (isVoicePlaying()) {
                      <svg viewBox="0 0 24 24" class="h-4 w-4 text-neutral-300">
                        <path
                          fill="currentColor"
                          d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"
                        />
                      </svg>
                      } @else {
                      <svg viewBox="0 0 24 24" class="h-4 w-4 text-neutral-300">
                        <path fill="currentColor" d="M8 5v14l11-7z" />
                      </svg>
                      }
                      <span class="text-xs text-neutral-400">voice intro</span>
                    </button>
                    @if (isVoicePlaying()) {
                    <button
                      class="h-7 w-7 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                      aria-label="stop voice intro"
                      (click)="stopVoiceIntro()"
                    >
                      <svg viewBox="0 0 24 24" class="h-4 w-4 text-neutral-300">
                        <path fill="currentColor" d="M6 6h12v12H6z" />
                      </svg>
                    </button>
                    }
                  </div>
                  }

                  <!-- Basic Stats - Updated Order: Age → Height → Weight → Gender -->
                  @if (isActor()) {
                  <div class="grid grid-cols-4 gap-2 text-center">
                    @if (profileData()?.age) {
                    <div class="flex flex-col">
                      <span class="text-base font-medium text-neutral-200">{{
                        profileData()?.age
                      }}</span>
                      <span class="text-xs text-neutral-500">age</span>
                    </div>
                    } @if (profileData()?.actorProfile?.height) {
                    <div class="flex flex-col">
                      <span class="text-base font-medium text-neutral-200">{{
                        formatHeight(profileData()?.actorProfile?.height)
                      }}</span>
                      <span class="text-xs text-neutral-500">height</span>
                    </div>
                    } @if (profileData()?.actorProfile?.weight) {
                    <div class="flex flex-col">
                      <span class="text-base font-medium text-neutral-200">{{
                        formatWeight(profileData()?.actorProfile?.weight)
                      }}</span>
                      <span class="text-xs text-neutral-500">weight</span>
                    </div>
                    } @if (profileData()?.gender) {
                    <div class="flex flex-col">
                      <span class="text-base font-medium text-neutral-200">{{
                        profileData()?.gender
                      }}</span>
                      <span class="text-xs text-neutral-500">gender</span>
                    </div>
                    }
                  </div>
                  } @else {
                  <div class="flex items-center gap-4 text-xs text-neutral-400">
                    @if (profileData()?.age) {
                    <div class="flex flex-col">
                      <span class="text-base font-medium text-neutral-200">{{
                        profileData()?.age
                      }}</span>
                      <span class="text-xs text-neutral-500">age</span>
                    </div>
                    } @if (profileData()?.gender) {
                    <div class="flex flex-col">
                      <span class="text-base font-medium text-neutral-200">{{
                        profileData()?.gender
                      }}</span>
                      <span class="text-xs text-neutral-500">gender</span>
                    </div>
                    }
                  </div>
                  }

                  <!-- Connect Button and Block Menu (for viewing other profiles) -->
                  @if (!isViewingOwnProfile() && (canConnect() ||
                  targetUserId())) {
                  <div class="flex items-center gap-2 pt-2">
                    @if (canConnect()) {
                    <button
                      (click)="connectWithUser()"
                      [disabled]="isConnecting()"
                      class="px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2"
                      [ngClass]="{
                        'bg-[#90ACC8] hover:bg-[#7A9AB8] text-white':
                          !isConnecting() && !isActorTheme(),
                        'bg-purple-600 hover:bg-purple-700 text-white':
                          !isConnecting() && isActorTheme(),
                        'bg-neutral-700 text-neutral-400 cursor-not-allowed':
                          isConnecting()
                      }"
                    >
                      @if (isConnecting()) {
                      <span class="inline-flex space-x-1">
                        <span
                          class="w-1 h-1 bg-neutral-300 rounded-full animate-bounce"
                          style="animation-delay: 0ms"
                        ></span>
                        <span
                          class="w-1 h-1 bg-neutral-300 rounded-full animate-bounce"
                          style="animation-delay: 150ms"
                        ></span>
                        <span
                          class="w-1 h-1 bg-neutral-300 rounded-full animate-bounce"
                          style="animation-delay: 300ms"
                        ></span>
                      </span>
                      <span>connecting...</span>
                      } @else {
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                        ></path>
                      </svg>
                      <span>connect</span>
                      }
                    </button>
                    } @if (targetUserId()) {
                    <div class="relative">
                      <button
                        type="button"
                        (click)="showBlockMenu.set(!showBlockMenu())"
                        class="p-1.5 rounded-full hover:bg-neutral-800/50 transition-colors"
                        title="More options"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="text-neutral-400"
                        >
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="12" cy="5" r="1"></circle>
                          <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                      </button>

                      @if (showBlockMenu()) {
                      <div
                        class="absolute left-1/2 -translate-x-1/2 mt-2 w-40 rounded-lg shadow-xl z-10 border bg-neutral-900 border-white/10"
                      >
                        @if (!isUserBlocked()) {
                        <button
                          type="button"
                          (click)="blockUser()"
                          class="w-full px-4 py-2 text-left text-sm transition rounded-lg flex items-center gap-2 hover:bg-white/5 text-red-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line
                              x1="4.93"
                              y1="4.93"
                              x2="19.07"
                              y2="19.07"
                            ></line>
                          </svg>
                          Block User
                        </button>
                        } @else {
                        <button
                          type="button"
                          (click)="unblockUser()"
                          class="w-full px-4 py-2 text-left text-sm transition rounded-lg flex items-center gap-2 hover:bg-white/5 text-green-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path
                              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                            ></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Unblock User
                        </button>
                        }
                      </div>
                      }
                    </div>
                    }
                  </div>
                  }
                </div>
              </div>

              <!-- Media tabs - Actor only -->
              @if (isActor()) {
              <div class="my-3">
                <div
                  class="flex items-center gap-2 border-b border-neutral-800"
                >
                  <button
                    class="px-4 py-2 text-sm transition-all duration-200 border-b-2"
                    [ngClass]="{
                      'border-purple-400 text-purple-200':
                        mediaTab === 'videos' && isActorTheme(),
                      'border-white text-white':
                        mediaTab === 'videos' && !isActorTheme(),
                      'border-transparent text-neutral-500 hover:text-neutral-300':
                        mediaTab !== 'videos'
                    }"
                    (click)="mediaTab = 'videos'"
                  >
                    videos
                  </button>
                  <button
                    class="px-4 py-2 text-sm transition-all duration-200 border-b-2"
                    [ngClass]="{
                      'border-purple-400 text-purple-200':
                        mediaTab === 'photos' && isActorTheme(),
                      'border-white text-white':
                        mediaTab === 'photos' && !isActorTheme(),
                      'border-transparent text-neutral-500 hover:text-neutral-300':
                        mediaTab !== 'photos'
                    }"
                    (click)="mediaTab = 'photos'"
                  >
                    photos
                  </button>
                </div>
              </div>

              <!-- Videos Tab Content -->
              @if (mediaTab === 'videos') {
              <!-- Loading Skeleton -->
              @if (isLoadingMedia()) {
              <div class="grid grid-cols-2 gap-2 mb-4">
                @for (i of [1, 2]; track i) {
                <div
                  class="aspect-video rounded-lg bg-neutral-800/50 animate-pulse"
                ></div>
                }
              </div>
              } @else if (hasVideos()) {
              <div class="max-h-[400px] overflow-y-auto mb-4">
                <div class="grid grid-cols-2 gap-2">
                  @for (video of videoData(); track video.url; let idx = $index)
                  {
                  <div
                    class="aspect-video rounded-lg bg-neutral-800/50 cursor-pointer hover:ring-2 transition-all relative group"
                    [ngClass]="{
                      'hover:ring-purple-500/50': isActorTheme(),
                      'hover:ring-neutral-600': !isActorTheme(),
                      'overflow-hidden': openMenuUrl() !== video.url,
                      'overflow-visible': openMenuUrl() === video.url
                    }"
                    (click)="openPreviewModal(video.url, 'video')"
                  >
                    <!-- Display cover image if available, otherwise fallback to video -->
                    @if (video.coverImageUrl) {
                    <img
                      [src]="video.coverImageUrl"
                      alt="Video thumbnail"
                      class="w-full h-full object-cover pointer-events-none bg-neutral-900 rounded-lg"
                      loading="lazy"
                    />
                    } @else {
                    <video
                      [src]="video.url"
                      class="w-full h-full object-cover pointer-events-none bg-neutral-900 rounded-lg"
                      preload="metadata"
                      loading="lazy"
                    ></video>
                    }

                    <!-- Play icon overlay -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div class="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors">
                        <svg
                          class="w-6 h-6 text-white ml-1"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    <!-- 3-dot menu button (only for own profile) -->
                    @if (isViewingOwnProfile()) {
                    <button
                      (click)="toggleMenu(video.url, $event)"
                      class="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                      aria-label="More options"
                    >
                      <svg
                        class="w-4 h-4 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                        />
                      </svg>
                    </button>

                    <!-- Dropdown Menu -->
                    @if (openMenuUrl() === video.url) {
                    <div
                      class="absolute top-10 right-2 bg-neutral-900 rounded-lg shadow-xl ring-1 ring-white/10 z-10 min-w-[160px] overflow-hidden"
                      (click)="$event.stopPropagation()"
                    >
                      <!-- Share Option -->
                      <button
                        (click)="shareMediaLink(video.url)"
                        class="w-full px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors flex items-center gap-3"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        <span class="text-sm">Share Link</span>
                      </button>

                      <!-- Delete Option -->
                      <button
                        (click)="showDeleteConfirmation(video.url, 'video')"
                        class="w-full px-4 py-2.5 text-left text-red-400 hover:bg-neutral-800 transition-colors flex items-center gap-3"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span class="text-sm">Delete</span>
                      </button>
                    </div>
                    } }
                  </div>
                  }

                  <!-- Add More Videos Button (+ icon in grid) -->
                  @if (isViewingOwnProfile() && videoUrls().length < 4) {
                  <button
                    (click)="navigateToUpload()"
                    class="aspect-video rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      class="h-8 w-8 text-neutral-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  }
                </div>
              </div>

              <!-- Add More Videos Text Button (for 4+ videos) -->
              @if (isViewingOwnProfile() && videoUrls().length >= 4) {
              <button
                (click)="navigateToUpload()"
                class="w-full py-2 text-center text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Add more
              </button>
              }
              } @else if (isViewingOwnProfile()) {
              <button
                (click)="navigateToUpload()"
                class="w-full aspect-video rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors flex flex-col items-center justify-center gap-2 mb-4"
              >
                <svg
                  class="h-8 w-8 text-neutral-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span class="text-xs text-neutral-500 uppercase tracking-wide"
                  >Add Video</span
                >
              </button>
              } @else {
              <!-- Empty state for other users' profiles -->
              <div
                class="w-full aspect-video rounded-lg bg-neutral-800/20 flex flex-col items-center justify-center gap-2 mb-4"
              >
                <svg
                  class="h-8 w-8 text-neutral-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"
                  />
                </svg>
                <span class="text-xs text-neutral-500 text-center"
                  >No videos uploaded yet</span
                >
              </div>
              } }

              <!-- Photos Tab Content -->
              @if (mediaTab === 'photos') {
              <!-- Loading Skeleton -->
              @if (isLoadingMedia()) {
              <div class="grid grid-cols-2 gap-2 mb-4">
                @for (i of [1, 2]; track i) {
                <div
                  class="aspect-video rounded-lg bg-neutral-800/50 animate-pulse"
                ></div>
                }
              </div>
              } @else if (hasImages()) {
              <div class="grid grid-cols-2 gap-2 mb-4">
                @for (imageUrl of galleryImageUrls(); track imageUrl; let idx =
                $index) { @if (idx < 4) {
                <div
                  class="aspect-video rounded-lg bg-neutral-800/50 cursor-pointer hover:ring-2 transition-all relative group"
                  [ngClass]="{
                    'hover:ring-purple-500/50': isActorTheme(),
                    'hover:ring-neutral-600': !isActorTheme(),
                    'overflow-hidden': openMenuUrl() !== imageUrl,
                    'overflow-visible': openMenuUrl() === imageUrl
                  }"
                  (click)="openPreviewModal(imageUrl, 'image')"
                >
                  <img
                    [src]="imageUrl"
                    alt="Portfolio image"
                    class="w-full h-full object-cover rounded-lg"
                  />

                  <!-- 3-dot menu button (only for own profile) -->
                  @if (isViewingOwnProfile()) {
                  <button
                    (click)="toggleMenu(imageUrl, $event)"
                    class="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="More options"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                      />
                    </svg>
                  </button>

                  <!-- Dropdown Menu -->
                  @if (openMenuUrl() === imageUrl) {
                  <div
                    class="absolute top-10 right-2 bg-neutral-900 rounded-lg shadow-xl ring-1 ring-white/10 z-10 min-w-[160px] overflow-hidden"
                    (click)="$event.stopPropagation()"
                  >
                    <!-- Share Option -->
                    <button
                      (click)="shareMediaLink(imageUrl)"
                      class="w-full px-4 py-2.5 text-left text-white hover:bg-neutral-800 transition-colors flex items-center gap-3"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      <span class="text-sm">Share Link</span>
                    </button>

                    <!-- Delete Option -->
                    <button
                      (click)="showDeleteConfirmation(imageUrl, 'image')"
                      class="w-full px-4 py-2.5 text-left text-red-400 hover:bg-neutral-800 transition-colors flex items-center gap-3"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span class="text-sm">Delete</span>
                    </button>
                  </div>
                  } }
                </div>
                } }

                <!-- Add More Images Button -->
                @if (isViewingOwnProfile() && galleryImageUrls().length < 4) {
                <button
                  (click)="navigateToUpload()"
                  class="aspect-video rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors flex items-center justify-center"
                >
                  <svg
                    class="h-8 w-8 text-neutral-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                }
              </div>
              } @else if (isViewingOwnProfile()) {
              <button
                (click)="navigateToUpload()"
                class="w-full aspect-video rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors flex flex-col items-center justify-center gap-2 mb-4"
              >
                <svg
                  class="h-8 w-8 text-neutral-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span class="text-xs text-neutral-500 uppercase tracking-wide"
                  >Add Image</span
                >
              </button>
              } @else {
              <!-- Empty state for other users' profiles -->
              <div
                class="w-full aspect-video rounded-lg bg-neutral-800/20 flex flex-col items-center justify-center gap-2 mb-4"
              >
                <svg
                  class="h-8 w-8 text-neutral-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span class="text-xs text-neutral-500 text-center"
                  >No photos uploaded yet</span
                >
              </div>
              } } }

              <!-- Social Links -->
              @if (hasSocialLinks() || isActor() || isViewingOwnProfile()) {
              <div class="pt-3 border-t border-neutral-800">
                <div class="text-sm text-neutral-500 mb-2">social links</div>
                <div class="flex items-center gap-2">
                  @if (profileData()?.social?.instaIdUrl) {
                  <a
                    [href]="profileData()?.social?.instaIdUrl"
                    target="_blank"
                    class="h-8 w-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                    aria-label="Instagram"
                  >
                    <svg
                      class="h-4 w-4 text-neutral-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path
                        d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
                      />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                  } @if (profileData()?.social?.youtubeIdUrl) {
                  <a
                    [href]="profileData()?.social?.youtubeIdUrl"
                    target="_blank"
                    class="h-8 w-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                    aria-label="YouTube"
                  >
                    <svg
                      class="h-4 w-4 text-neutral-400"
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
                    class="h-8 w-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                    aria-label="External Link"
                  >
                    <svg
                      class="h-4 w-4 text-neutral-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
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
                    class="h-8 w-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                    aria-label="Additional Link"
                  >
                    <svg
                      class="h-4 w-4 text-neutral-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
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

                  <!-- Add Social Link Button -->
                  @if (isViewingOwnProfile()) {
                  <button
                    (click)="navigateToSocialLinks()"
                    class="h-8 w-8 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
                    aria-label="Add social link"
                  >
                    <svg
                      class="h-4 w-4 text-neutral-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  }
                </div>
              </div>
              }
            </div>
          </section>

          <!-- Right: Details -->
          <section class="space-y-4">
            @if (isActor()) {
            <!-- Location -->
            <div
              class="rounded-xl p-5 border backdrop-blur-xl"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10':
                  isActorTheme(),
                'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30':
                  !isActorTheme()
              }"
            >
              <div
                class="text-sm text-neutral-500 uppercase tracking-wide mb-2"
              >
                location
              </div>
              <div class="text-sm text-neutral-300">
                {{ profileData()?.location || 'Not specified' }}
              </div>
            </div>

            <!-- Languages -->
            @if (hasLanguages()) {
            <div
              class="rounded-xl p-5 border backdrop-blur-xl"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10':
                  isActorTheme(),
                'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30':
                  !isActorTheme()
              }"
            >
              <div
                class="text-sm text-neutral-500 uppercase tracking-wide mb-3"
              >
                languages
              </div>
              <div class="space-y-2">
                @for (language of sortedLanguages(); track
                getLanguageName(language)) {
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-300">{{
                    getLanguageName(language)
                  }}</span>
                  @if (hasLanguageRating(language)) {
                  <div class="flex items-center gap-0.5">
                    @for (star of [1,2,3,4,5]; track star) {
                    <svg
                      class="w-3 h-3"
                      [ngClass]="{
                        'text-yellow-400': star <= getLanguageRating(language),
                        'text-neutral-700': star > getLanguageRating(language)
                      }"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    }
                  </div>
                  }
                </div>
                }
              </div>
            </div>
            }

            <!-- Extra Curricular / Skills -->
            @if (hasSkills()) {
            <div
              class="rounded-xl p-5 border backdrop-blur-xl"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10':
                  isActorTheme(),
                'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30':
                  !isActorTheme()
              }"
            >
              <div
                class="text-sm text-neutral-500 uppercase tracking-wide mb-3"
              >
                extra curricular
              </div>
              <div class="space-y-2">
                @for (skill of sortedSkills(); track getSkillName(skill)) {
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-300">{{
                    getSkillName(skill)
                  }}</span>
                  @if (hasSkillRating(skill)) {
                  <div class="flex items-center gap-0.5">
                    @for (star of [1,2,3,4,5]; track star) {
                    <svg
                      class="w-3 h-3"
                      [ngClass]="{
                        'text-yellow-400': star <= getSkillRating(skill),
                        'text-neutral-700': star > getSkillRating(skill)
                      }"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    }
                  </div>
                  }
                </div>
                }
              </div>
            </div>
            } } @else {
            <!-- Producer Sections -->
            <!-- Location -->
            <div
              class="rounded-xl p-5 border backdrop-blur-xl"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10':
                  isActorTheme(),
                'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30':
                  !isActorTheme()
              }"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div
                    class="text-sm text-neutral-500 uppercase tracking-wide mb-2"
                  >
                    location
                  </div>
                  <div class="text-sm text-neutral-300">
                    {{ profileData()?.location || 'Not specified' }}
                  </div>
                </div>
                <div>
                  <div
                    class="text-sm text-neutral-500 uppercase tracking-wide mb-2"
                  >
                    designation
                  </div>
                  <div class="text-sm text-neutral-300">
                    {{
                      profileData()?.producerProfile?.designation ||
                        'Not specified'
                    }}
                  </div>
                </div>
                <div>
                  <div
                    class="text-sm text-neutral-500 uppercase tracking-wide mb-2"
                  >
                    production house
                  </div>
                  <div class="text-sm text-neutral-300">
                    {{
                      profileData()?.producerProfile?.productionHouse ||
                        'Not specified'
                    }}
                  </div>
                </div>
                <div>
                  <div
                    class="text-sm text-neutral-500 uppercase tracking-wide mb-2"
                  >
                    industry type
                  </div>
                  <div class="text-sm text-neutral-300">
                    {{
                      profileData()?.producerProfile?.industryType ||
                        'Not specified'
                    }}
                  </div>
                </div>
              </div>
            </div>

            }

            <!-- Education -->
            @if (hasEducation()) {
            <div
              class="rounded-xl p-5 border backdrop-blur-xl"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10':
                  isActorTheme(),
                'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30':
                  !isActorTheme()
              }"
            >
              <div
                class="text-sm text-neutral-500 uppercase tracking-wide mb-3"
              >
                {{ isActor() ? 'acting education' : 'education' }}
              </div>
              <div class="space-y-3">
                @for (edu of getEducationList(); track edu) {
                <div>
                  <div class="text-sm text-neutral-300 font-medium">
                    {{ edu.courseName }}
                  </div>
                  <div class="text-xs text-neutral-500 mt-0.5">
                    {{ edu.schoolName }} | {{ edu.yearCompleted }}
                  </div>
                  @if (edu.certificateUrl) {
                  <a
                    [href]="edu.certificateUrl"
                    target="_blank"
                    class="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium text-white bg-neutral-800/50 hover:bg-neutral-700/50 rounded-lg transition-colors"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    view certificate
                  </a>
                  }
                </div>
                }
              </div>
            </div>
            }

            <!-- Experiences -->
            @if (hasWorks()) {
            <div
              class="rounded-xl p-5 border backdrop-blur-xl"
              [ngClass]="{
                'bg-purple-950/10 ring-1 ring-purple-900/10 border-purple-950/10':
                  isActorTheme(),
                'bg-[#101214]/95 ring-1 ring-[#53565F]/20 border-[#364361]/30':
                  !isActorTheme()
              }"
            >
              <div
                class="text-sm text-neutral-500 uppercase tracking-wide mb-3"
              >
                {{ isActorTheme() ? 'experiences' : 'previous credits' }}
              </div>
              <div class="space-y-3">
                @for (work of getWorksList(); track work) {
                <div>
                  <div class="text-sm text-neutral-300 font-medium">
                    {{ work.projectName }}
                  </div>
                  <div class="text-xs text-neutral-500 mt-0.5">
                    @if (work.role) {
                    {{ work.role }}@if (work.genre) {<span>
                      {{ isActor() ? '|' : '•' }} {{ work.genre }}</span
                    >} {{ isActor() ? '|' : '•' }} {{ work.year }}
                    } @else {
                    {{ work.genre || 'supporting role' }}
                    {{ isActor() ? '|' : '•' }} {{ work.year }}
                    }
                  </div>
                  @if (work.projectLink) {
                  <a
                    [href]="work.projectLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium text-white bg-neutral-800/50 hover:bg-neutral-700/50 rounded-lg transition-colors"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    view project
                  </a>
                  }
                </div>
                }
              </div>
            </div>
            }
          </section>
        </div>
      </div>
    </div>

    <!-- Floating Support Button (only for public profiles) -->
    @if (!isViewingOwnProfile()) {
    <button
      (click)="navigateToSupport()"
      class="fixed bottom-6 right-6 z-40 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 ring-2 ring-white/20 hover:ring-white/30"
      aria-label="Support & Feedback"
    >
      <svg
        class="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"
        />
      </svg>
      <span class="font-medium text-sm">Report / Feedback</span>
    </button>
    }

    <!-- Media Preview Modal -->
    @if (isPreviewModalOpen()) {
    <div
      class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
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


        <!-- Profile Picture Actions (only for images and own profile) -->
        @if (previewMediaType() === 'image' && isViewingOwnProfile()) {
        <div class="absolute top-4 left-4 z-10 flex gap-2">
          @if (!isPreviewImageProfilePicture()) {
          <button
            (click)="setAsProfilePicture(); $event.stopPropagation()"
            class="px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors ring-1 ring-white/20 flex items-center gap-2"
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
          } @if (isPreviewImageProfilePicture()) {
          <button
            (click)="removeProfilePicture(); $event.stopPropagation()"
            class="px-4 py-2 bg-red-600/70 hover:bg-red-600/90 rounded-lg transition-colors ring-1 ring-white/20 flex items-center gap-2"
            aria-label="Remove profile picture"
          >
            <svg
              class="w-5 h-5 text-white"
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
            <span class="text-white text-sm">Remove Profile Picture</span>
          </button>
          }
        </div>
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
        <div
          class="w-full h-full flex items-center justify-center px-20 relative"
          [ngClass]="{ 'pb-32': previewMediaType() === 'video' && !isProfilePicIsolationMode() }"
        >
          @if (previewMediaType() === 'image') {
          <img
            [src]="previewMediaUrl()"
            alt="Preview"
            class="max-w-full max-h-full object-contain rounded-lg"
            [class.opacity-0]="isMediaLoading()"
            (load)="onMediaLoaded()"
          />
          } @else if (previewMediaType() === 'video') {
          <video
            #videoPlayer
            [src]="previewMediaUrl()"
            class="max-w-full max-h-full object-contain rounded-lg"
            [class.opacity-0]="isMediaLoading()"
            (loadeddata)="onMediaLoaded()"
            (play)="onVideoPlay()"
            (pause)="onVideoPause()"
            (timeupdate)="onVideoTimeUpdate($event)"
            (ended)="onVideoEnded()"
            controls
            controlsList="nodownload"
            autoplay
          ></video>
          }

          <!-- Loading Spinner -->
          @if (isMediaLoading()) {
          <div class="absolute inset-0 flex items-center justify-center">
            <svg
              class="w-12 h-12 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          }
        </div>

        <!-- Video Info Section (below video) -->
        @if (previewMediaType() === 'video' && !isProfilePicIsolationMode() && (currentVideoTags().length > 0 || currentVideoDescription() || currentVideoUpdatedAt())) {
        <div class="absolute bottom-4 left-4 right-4 z-10">
          <!-- Description Section (Full Width) -->
          <div
            class="w-full px-4 py-3 bg-black/80 backdrop-blur-sm rounded-lg ring-1 ring-white/20 flex justify-between items-start gap-4"
          >
            <!-- Left: Description Content -->
            <div class="flex-1 space-y-2">
              <!-- Description Title -->
              <div class="text-white font-semibold text-sm">Description</div>

              <!-- Updated Date -->
              @if (currentVideoUpdatedAt()) {
              <div class="text-neutral-400 text-xs">
                {{ currentVideoUpdatedAt() }}
              </div>
              }

              <!-- Description Text -->
              @if (currentVideoDescription()) {
              <div class="text-white text-sm leading-relaxed">
                {{ currentVideoDescription() }}
              </div>
              }

              <!-- Tags -->
              @if (currentVideoTags().length > 0) {
              <div class="flex flex-wrap gap-2 pt-2">
                @for (tag of currentVideoTags(); track tag) {
                <span
                  class="px-3 py-1 bg-white/10 text-white text-xs rounded-full ring-1 ring-white/20"
                >
                  {{ tag }}
                </span>
                }
              </div>
              }
            </div>

            <!-- Right: Share and Delete Actions -->
            <div class="flex gap-2 flex-shrink-0">
              <!-- Share Link Button (visible to everyone) -->
              <button
                (click)="shareMediaLink(); $event.stopPropagation()"
                class="px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors ring-1 ring-white/20 flex items-center gap-2"
                aria-label="Share link"
                title="Copy media link to clipboard"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span class="text-white text-sm">Share</span>
              </button>

              <!-- Delete Button (only for own profile) -->
              @if (isViewingOwnProfile()) {
              <button
                (click)="showDeleteConfirmation(); $event.stopPropagation()"
                class="px-4 py-2 bg-red-600/70 hover:bg-red-600/90 rounded-lg transition-colors ring-1 ring-white/20 flex items-center gap-2"
                aria-label="Delete media"
                title="Delete this media"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span class="text-white text-sm">Delete</span>
              </button>
              }
            </div>
          </div>
        </div>
        }

        <!-- Counter indicator (hidden for videos since info is at bottom) -->
        @if (!isProfilePicIsolationMode() && previewMediaType() === 'image') {
        <div
          class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/50 rounded-full text-white text-sm ring-1 ring-white/20"
        >
          {{ currentMediaIndex() + 1 }} / {{ currentMediaList().length }}
        </div>
        }
      </div>
    </div>
    }

    <!-- Delete Confirmation Dialog -->
    @if (isDeleteConfirmationOpen()) {
    <div
      class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      (click)="cancelDelete()"
    >
      <div
        class="bg-neutral-900 rounded-xl p-6 max-w-md w-full ring-1 ring-white/10 shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <!-- Warning Icon -->
        <div class="flex items-center justify-center mb-4">
          <div class="bg-red-600/20 rounded-full p-3">
            <svg
              class="w-8 h-8 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <!-- Dialog Title -->
        <h3 class="text-xl font-semibold text-white text-center mb-2">
          Delete {{ pendingDeleteType() === 'video' ? 'Video' : 'Image' }}?
        </h3>

        <!-- Dialog Message -->
        <p class="text-neutral-400 text-center mb-6">
          This action cannot be undone. The {{ pendingDeleteType() }} will be
          permanently removed from your gallery.
        </p>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <!-- Cancel Button -->
          <button
            (click)="cancelDelete()"
            class="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>

          <!-- Confirm Delete Button -->
          <button
            (click)="confirmDelete()"
            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Delete
          </button>
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
            rgba(147, 51, 234, 0.02) 0%,
            transparent 35%
          ),
          radial-gradient(
            ellipse at bottom right,
            rgba(168, 85, 247, 0.015) 0%,
            transparent 35%
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
  private route = inject(ActivatedRoute);
  private profileUrlService = inject(ProfileUrlService);
  private chatService = inject(ChatService);
  private analyticsService = inject(AnalyticsService);
  private blockService = inject(BlockService);

  // Video player reference for tracking
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  mediaTab: 'videos' | 'photos' = 'videos';

  // User role and profile data signals
  userRole = signal<string>('actor');
  profileData = signal<Profile | null>(null);
  isActor = computed(() => this.userRole() === 'actor');
  userData = signal<UserDoc | null>(null);

  // Profile viewing signals
  isViewingOwnProfile = signal<boolean>(true);
  targetUsername = signal<string | null>(null);
  targetUserId = signal<string | null>(null);
  currentUserRole = signal<string>('producer'); // Default to producer to prevent purple flash
  
  // Theming based on logged-in user's role (not the profile being viewed)
  isActorTheme = computed(() => this.currentUserRole() === 'actor');

  // Connect button state
  isConnecting = signal<boolean>(false);
  canConnect = computed(() => {
    const currentUser = this.auth.getCurrentUser();
    const targetId = this.targetUserId();

    // Can connect if:
    // 1. Not viewing own profile
    // 2. Current user is a producer
    // 3. Target user is an actor
    // 4. Both users exist
    return (
      !this.isViewingOwnProfile() &&
      currentUser !== null &&
      targetId !== null &&
      this.currentUserRole() === 'producer' &&
      this.userRole() === 'actor'
    );
  });

  // Block functionality
  isUserBlocked = signal<boolean>(false);
  showBlockMenu = signal<boolean>(false);

  // Media signals
  videoData = signal<Array<{ url: string; docId: string; userId: string; coverImageUrl?: string }>>([]);
  videoUrls = computed(() => this.videoData().map((v) => v.url));
  imageUrls = signal<string[]>([]);
  isLoadingMedia = signal(false);

  // Gallery images (excluding profile picture)
  galleryImageUrls = computed(() => {
    const allImages = this.imageUrls();
    const profilePicUrl = this.getProfileImageUrl();

    if (!profilePicUrl) {
      return allImages;
    }

    // Filter out the profile picture
    return allImages.filter((url) => url !== profilePicUrl);
  });

  // Modal state
  isPreviewModalOpen = signal(false);
  previewMediaUrl = signal<string | null>(null);
  previewMediaType = signal<'image' | 'video'>('image');
  currentMediaIndex = signal(0);
  isProfilePicIsolationMode = signal(false);
  isMediaLoading = signal(false);
  currentVideoTags = signal<string[]>([]);
  currentVideoDescription = signal<string>('');
  currentVideoUpdatedAt = signal<string>('');

  // Delete confirmation dialog state
  isDeleteConfirmationOpen = signal(false);
  pendingDeleteUrl = signal<string | null>(null);
  pendingDeleteType = signal<'image' | 'video'>('image');

  // Thumbnail context menu state
  openMenuUrl = signal<string | null>(null);

  // Share menu state
  isShareMenuOpen = signal(false);

  // Video tracking state
  private currentVideoId: string | null = null;
  private currentActorId: string | null = null;

  // Computed for navigation
  currentMediaList = computed(() => {
    return this.previewMediaType() === 'video'
      ? this.videoUrls()
      : this.imageUrls();
  });

  canGoToPrevious = computed(
    () => !this.isProfilePicIsolationMode() && this.currentMediaIndex() > 0
  );
  canGoToNext = computed(
    () =>
      !this.isProfilePicIsolationMode() &&
      this.currentMediaIndex() < this.currentMediaList().length - 1
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
  hasImages = computed(() => this.galleryImageUrls().length > 0);

  hasEducation = computed(() => {
    const profile = this.profileData();
    if (this.isActor()) {
      return (
        profile?.actorProfile?.listEducation &&
        profile.actorProfile.listEducation.length > 0
      );
    } else {
      return (
        profile?.producerProfile?.listEducation &&
        profile.producerProfile.listEducation.length > 0
      );
    }
  });

  hasWorks = computed(() => {
    const profile = this.profileData();
    if (this.isActor()) {
      return (
        profile?.actorProfile?.actorWorks &&
        profile.actorProfile.actorWorks.length > 0
      );
    } else {
      return (
        profile?.producerProfile?.producerWorks &&
        profile.producerProfile.producerWorks.length > 0
      );
    }
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

  // Sorted languages by rating (descending)
  sortedLanguages = computed(() => {
    const profile = this.profileData();
    const languages = profile?.actorProfile?.languages || [];

    // Convert strings to Language objects and sort by rating
    return [...languages].sort((a, b) => {
      const ratingA = typeof a === 'object' ? a.rating : 0;
      const ratingB = typeof b === 'object' ? b.rating : 0;
      return ratingB - ratingA; // Descending order
    });
  });

  // Sorted skills by rating (descending)
  sortedSkills = computed(() => {
    const profile = this.profileData();
    const skills = profile?.actorProfile?.skills || [];

    // Convert strings to Skill objects and sort by rating
    return [...skills].sort((a, b) => {
      const ratingA = typeof a === 'object' ? a.rating : 0;
      const ratingB = typeof b === 'object' ? b.rating : 0;
      return ratingB - ratingA; // Descending order
    });
  });

  async ngOnInit() {
    // Load current user's role first
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      try {
        const currentUserDoc = await getDoc(
          doc(this.firestore, 'users', currentUser.uid)
        );
        if (currentUserDoc.exists()) {
          const currentUserData = currentUserDoc.data() as UserDoc;
          this.currentUserRole.set(currentUserData.currentRole || 'producer');
        }
      } catch (error) {
        console.error('Error loading current user role:', error);
        // Fallback to producer on error
        this.currentUserRole.set('producer');
      }
    }

    // Check if we have a slugUid parameter (viewing someone else's profile)
    const slugUid = this.route.snapshot.paramMap.get('slugUid');
    // console.log('ProfileComponent ngOnInit - slugUid:', slugUid);

    if (slugUid) {
      // Viewing someone else's profile via stored slug-uid URL
      // console.log('Loading profile for slugUid:', slugUid);
      this.isViewingOwnProfile.set(false);
      this.loadUserProfileBySlugUid(slugUid);
    } else {
      // Viewing own profile
      // console.log('Loading own profile');
      this.isViewingOwnProfile.set(true);
      this.loadUserProfile();
    }
  }

  async ngOnDestroy() {
    // End profile view tracking when leaving the page
    await this.analyticsService.endProfileView();

    // End any active video tracking session
    if (this.currentVideoId && this.currentActorId) {
      await this.analyticsService.endVideoTracking(
        this.currentVideoId,
        this.currentActorId
      );
    }
  }

  /**
   * Load user profile by stored slug-uid parameter
   * Format: slug-uid (e.g., "rajkumar-rao-xK9mP2nQ7R") - STORED in database
   */
  private async loadUserProfileBySlugUid(slugUid: string) {
    try {
      // console.log('Loading profile by slugUid:', slugUid);

      // Query profiles collection by slug field (which contains slug-uid)
      const profilesRef = collection(this.firestore, 'profiles');
      const profileQuery = query(
        profilesRef,
        where('slug', '==', slugUid),
        limit(1)
      );
      const profileDocs = await getDocs(profileQuery);

      if (profileDocs.empty) {
        // Profile not found by slug, try finding by UID suffix match
        console.warn('Profile not found by slug, trying UID suffix match...');

        const shortUid = this.profileUrlService.extractUid(slugUid);

        if (!shortUid) {
          console.error('Invalid slug-uid format');
          this.router.navigate(['/discover']);
          return;
        }

        // console.log(
        //   'Extracted short UID:',
        //   shortUid,
        //   'searching for matching profile...'
        // );

        // Query all profiles and find one where UID ends with shortUid
        const allProfilesQuery = query(collection(this.firestore, 'profiles'));
        const allProfiles = await getDocs(allProfilesQuery);

        const matchingProfile = allProfiles.docs.find((doc) => {
          const profile = doc.data() as Profile;
          return profile.uid.endsWith(shortUid);
        });

        if (!matchingProfile) {
          console.error('No profile found with matching UID suffix');
          this.router.navigate(['/discover']);
          return;
        }

        const profileData = matchingProfile.data() as Profile;
        // console.log('Profile found via UID suffix match:', profileData);

        // Set profile data
        this.profileData.set(profileData);

        // Load user data
        const userDocRef = doc(this.firestore, 'users', profileData.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          this.userData.set(userData);
          this.userRole.set(userData.currentRole || 'actor');
          this.targetUsername.set(userData.name);
          this.targetUserId.set(profileData.uid);

          // Start profile view tracking (new analytics system)
          if (
            this.currentUserRole() === 'producer' &&
            userData.currentRole === 'actor'
          ) {
            const currentUser = this.auth.getCurrentUser();
            if (currentUser) {
              // Get current producer's info for notification
              const currentUserDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));
              const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() as UserDoc : null;
              const producerName = currentUserData?.name || 'A producer';
              
              // Get producer photo
              const producerProfileDoc = await getDoc(doc(this.firestore, 'profiles', currentUser.uid));
              const producerPhotoUrl = producerProfileDoc.exists() 
                ? producerProfileDoc.data()?.['producerProfile']?.['producerProfileImageUrl']
                : undefined;
              
              await this.analyticsService.startProfileView(
                profileData.uid,
                currentUser.uid,
                producerName,
                producerPhotoUrl
              );
            }
          }
        }

        // Load media
        this.loadMediaFromStorage(profileData.uid);

        // Check block status
        this.checkBlockStatus();
        return;
      }

      const profileDoc = profileDocs.docs[0];
      const profileData = profileDoc.data() as Profile;
      // console.log('Profile found by slug:', profileData);

      // Set profile data
      this.profileData.set(profileData);

      // Load user data
      const userDocRef = doc(this.firestore, 'users', profileData.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // User not found
        console.error('User not found for UID:', profileData.uid);
        this.router.navigate(['/discover']);
        return;
      }

      const userData = userDoc.data() as UserDoc;
      // console.log('User found:', userData);

      // Set user data
      this.userData.set(userData);
      this.userRole.set(userData.currentRole || 'actor');
      this.targetUsername.set(userData.name);
      this.targetUserId.set(profileData.uid);

      // Load media from storage
      this.loadMediaFromStorage(profileData.uid);

      // Start profile view tracking (new analytics system)
      if (
        this.currentUserRole() === 'producer' &&
        userData.currentRole === 'actor'
      ) {
        const currentUser = this.auth.getCurrentUser();
        if (currentUser) {
          // Get current producer's info for notification
          const currentUserDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));
          const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() as UserDoc : null;
          const producerName = currentUserData?.name || 'A producer';
          
          // Get producer photo
          const producerProfileDoc = await getDoc(doc(this.firestore, 'profiles', currentUser.uid));
          const producerPhotoUrl = producerProfileDoc.exists() 
            ? producerProfileDoc.data()?.['producerProfile']?.['producerProfileImageUrl']
            : undefined;
          
          await this.analyticsService.startProfileView(
            profileData.uid,
            currentUser.uid,
            producerName,
            producerPhotoUrl
          );
        }
      }

      // Check block status
      this.checkBlockStatus();
    } catch (error) {
      // Error loading profile, redirect to discover
      console.error('Error loading profile:', error);
      this.router.navigate(['/discover']);
    }
  }

  private async loadMediaFromStorage(userId: string) {
    this.isLoadingMedia.set(true);
    try {
      // Fetch videos from processed folder (original approach)
      const processedRef = ref(this.storage, `processed/${userId}`);
      const processedList = await listAll(processedRef);

      // Each prefix is a videoId folder containing 1080p.mp4
      const videoDataPromises = processedList.prefixes.map(
        async (videoIdFolder) => {
          try {
            const videoRef = ref(
              this.storage,
              `${videoIdFolder.fullPath}/1080p.mp4`
            );
            const url = await getDownloadURL(videoRef);
            // Extract docId from folder name (last part of path)
            const docId = videoIdFolder.name;

            // Fetch cover image URL from Firestore
            let coverImageUrl: string | undefined;
            try {
              const uploadDocRef = doc(
                this.firestore,
                `uploads/${userId}/userUploads/${docId}`
              );
              const uploadDoc = await getDoc(uploadDocRef);

              if (uploadDoc.exists()) {
                coverImageUrl = uploadDoc.data()?.['coverImageUrl'];

                if (coverImageUrl) {
                  console.log(`✅ Cover image found for video ${docId}:`, coverImageUrl);
                } else {
                  console.log(`⚠️ No cover image for video ${docId} - using fallback`);
                }
              } else {
                console.log(`⚠️ Upload document not found for video ${docId}`);
              }
            } catch (firestoreError) {
              console.warn(
                `❌ Failed to fetch cover image for video ${docId}:`,
                firestoreError
              );
              // Continue without cover image
            }

            return { url, docId, userId, coverImageUrl };
          } catch (error) {
            console.warn(
              `Failed to load video from ${videoIdFolder.fullPath}:`,
              error
            );
            return null;
          }
        }
      );

      const videosRaw = await Promise.all(videoDataPromises);
      const videos = videosRaw.filter((v) => v !== null) as Array<{ url: string; docId: string; userId: string; coverImageUrl?: string }>;

      // Log summary of cover images
      const withCover = videos.filter(v => v && v.coverImageUrl).length;
      const withoutCover = videos.length - withCover;
      console.log(`📊 Video thumbnails loaded: ${withCover} with cover images, ${withoutCover} using fallback`);

      this.videoData.set(videos);

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
      this.videoData.set([]);
      this.imageUrls.set([]);
    } finally {
      this.isLoadingMedia.set(false);
    }
  }

  /**
   * Track profile view analytics - DEPRECATED
   * Profile views are now tracked via startProfileView/endProfileView in ngOnInit/ngOnDestroy
   */

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
  getSocialIcon(url: string): string {
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

  navigateToSocialLinks() {
    this.router.navigate(['/discover/profile/edit'], {
      queryParams: { section: 'socials' },
    });
  }

  navigateToSupport() {
    this.router.navigate(['/discover/settings'], {
      queryParams: { tab: 'support' },
    });
  }

  /**
   * Video event handlers for analytics tracking
   */
  async onVideoPlay() {
    // Only track if viewing someone else's profile and user is a producer
    if (
      !this.currentVideoId ||
      !this.currentActorId ||
      this.isViewingOwnProfile()
    ) {
      return;
    }

    // Check if current user is a producer
    if (this.currentUserRole() !== 'producer') {
      return;
    }

    // Start tracking this video session
    await this.analyticsService.startVideoTracking(
      this.currentActorId,
      this.currentVideoId,
      this.currentActorId
    );
  }

  onVideoPause() {
    // Video pause doesn't need special handling - the service buffers updates
  }

  onVideoTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (!this.currentVideoId || !this.currentActorId || !video) {
      return;
    }

    // Update the current playback position

    this.analyticsService.updateVideoProgress(
      this.currentVideoId,
      this.currentActorId,
      video.currentTime
    );
  }

  async onVideoEnded() {
    // End the tracking session when video completes
    if (this.currentVideoId && this.currentActorId) {
      await this.analyticsService.endVideoTracking(
        this.currentVideoId,
        this.currentActorId
      );
    }
  }

  /**
   * Extract fileName from Firebase Storage URL
   */
  private extractFileNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Firebase Storage URLs contain the file path encoded
      // Example: .../videos%2F{fileName}?...
      const pathMatch = urlObj.pathname.match(/videos%2F([^?]+)/);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch (error) {
      console.error('Error extracting fileName from URL:', error);
      return null;
    }
  }

  async openPreviewModal(
    url: string,
    type: 'image' | 'video',
    isolationMode: boolean = false
  ) {
    this.previewMediaUrl.set(url);
    this.previewMediaType.set(type);
    this.isProfilePicIsolationMode.set(isolationMode);

    // Find the index of the current media in the appropriate list
    const mediaList = type === 'video' ? this.videoUrls() : this.imageUrls();
    const index = mediaList.indexOf(url);
    this.currentMediaIndex.set(index >= 0 ? index : 0);

    this.isPreviewModalOpen.set(true);

    // Prepare video tracking if it's a video (actual tracking starts on play event)
    if (type === 'video') {
      const videoInfo = this.videoData().find((v) => v.url === url);
      if (videoInfo) {
        this.currentVideoId = videoInfo.docId;
        this.currentActorId = this.targetUserId() || null;

        // Fetch video tags from Firestore
        await this.fetchVideoTags(videoInfo.userId, videoInfo.docId);
      }
    } else {
      // Clear video metadata if viewing an image
      this.currentVideoTags.set([]);
      this.currentVideoDescription.set('');
      this.currentVideoUpdatedAt.set('');
    }
  }

  async fetchVideoTags(userId: string, videoId: string) {
    try {
      const uploadDocRef = doc(
        this.firestore,
        `uploads/${userId}/userUploads/${videoId}`
      );
      const uploadDoc = await getDoc(uploadDocRef);

      if (uploadDoc.exists()) {
        const data = uploadDoc.data();
        const tags = data?.['metadata']?.['tags'] || [];
        const description = data?.['metadata']?.['description'] || '';
        const uploadedAt = data?.['uploadedAt'];

        this.currentVideoTags.set(tags);
        this.currentVideoDescription.set(description);

        // Format the uploadedAt date
        if (uploadedAt) {
          const date = uploadedAt.toDate ? uploadedAt.toDate() : new Date(uploadedAt);
          this.currentVideoUpdatedAt.set(this.formatDate(date));
        } else {
          this.currentVideoUpdatedAt.set('');
        }
      } else {
        this.currentVideoTags.set([]);
        this.currentVideoDescription.set('');
        this.currentVideoUpdatedAt.set('');
      }
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      this.currentVideoTags.set([]);
      this.currentVideoDescription.set('');
      this.currentVideoUpdatedAt.set('');
    }
  }

  formatDate(date: Date): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `Uploaded on ${month} ${day}, ${year}`;
  }

  async closePreviewModal() {
    // End video tracking if a video was playing
    if (this.currentVideoId && this.currentActorId) {
      await this.analyticsService.endVideoTracking(
        this.currentVideoId,
        this.currentActorId
      );
      this.currentVideoId = null;
      this.currentActorId = null;
    }

    this.isPreviewModalOpen.set(false);
    this.previewMediaUrl.set(null);
    this.currentMediaIndex.set(0);
    this.isProfilePicIsolationMode.set(false);
    this.currentVideoTags.set([]);
    this.currentVideoDescription.set('');
    this.currentVideoUpdatedAt.set('');
  }

  async goToPreviousMedia() {
    if (this.canGoToPrevious()) {
      // End current video tracking if switching from a video
      if (
        this.previewMediaType() === 'video' &&
        this.currentVideoId &&
        this.currentActorId
      ) {
        await this.analyticsService.endVideoTracking(
          this.currentVideoId,
          this.currentActorId
        );
        this.currentVideoId = null;
        this.currentActorId = null;
      }

      this.isMediaLoading.set(true);
      const newIndex = this.currentMediaIndex() - 1;
      this.currentMediaIndex.set(newIndex);
      const mediaList = this.currentMediaList();
      const newUrl = mediaList[newIndex];
      this.previewMediaUrl.set(newUrl);

      // Prepare video tracking if navigating to a video
      if (this.previewMediaType() === 'video') {
        const videoInfo = this.videoData().find((v) => v.url === newUrl);
        if (videoInfo) {
          this.currentVideoId = videoInfo.docId;
          this.currentActorId = this.targetUserId() || null;
          // Fetch video tags
          await this.fetchVideoTags(videoInfo.userId, videoInfo.docId);
        }
      } else {
        // Clear video metadata if navigating to an image
        this.currentVideoTags.set([]);
        this.currentVideoDescription.set('');
        this.currentVideoUpdatedAt.set('');
      }
    }
  }

  async goToNextMedia() {
    if (this.canGoToNext()) {
      // End current video tracking if switching from a video
      if (
        this.previewMediaType() === 'video' &&
        this.currentVideoId &&
        this.currentActorId
      ) {
        await this.analyticsService.endVideoTracking(
          this.currentVideoId,
          this.currentActorId
        );
        this.currentVideoId = null;
        this.currentActorId = null;
      }

      this.isMediaLoading.set(true);
      const newIndex = this.currentMediaIndex() + 1;
      this.currentMediaIndex.set(newIndex);
      const mediaList = this.currentMediaList();
      const newUrl = mediaList[newIndex];
      this.previewMediaUrl.set(newUrl);

      // Prepare video tracking if navigating to a video
      if (this.previewMediaType() === 'video') {
        const videoInfo = this.videoData().find((v) => v.url === newUrl);
        if (videoInfo) {
          this.currentVideoId = videoInfo.docId;
          this.currentActorId = this.targetUserId() || null;
          // Fetch video metadata
          await this.fetchVideoTags(videoInfo.userId, videoInfo.docId);
        }
      } else {
        // Clear video metadata if navigating to an image
        this.currentVideoTags.set([]);
        this.currentVideoDescription.set('');
        this.currentVideoUpdatedAt.set('');
      }
    }
  }

  onMediaLoaded() {
    this.isMediaLoading.set(false);
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
    // Navigate to edit profile basic info section
    this.router.navigate(['/discover/profile/edit'], {
      fragment: 'basic-info',
    });
  }

  viewProfilePicture() {
    const profileImageUrl = this.getProfileImageUrl();
    if (profileImageUrl) {
      this.openPreviewModal(profileImageUrl, 'image', true);
    }
  }

  isPreviewImageProfilePicture(): boolean {
    const profileImageUrl = this.getProfileImageUrl();
    const previewUrl = this.previewMediaUrl();
    return !!profileImageUrl && !!previewUrl && profileImageUrl === previewUrl;
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

      // Close the preview modal after removing
      this.closePreviewModal();
    } catch (error) {
      // Handle error silently
    }
  }

  /**
   * Toggle thumbnail context menu
   */
  toggleMenu(url: string, event: Event) {
    event.stopPropagation();
    if (this.openMenuUrl() === url) {
      this.openMenuUrl.set(null);
    } else {
      this.openMenuUrl.set(url);
    }
  }

  /**
   * Close thumbnail context menu
   */
  closeMenu() {
    this.openMenuUrl.set(null);
  }

  /**
   * Share media link by copying to clipboard (works for both modal and thumbnails)
   */
  async shareMediaLink(url?: string) {
    const mediaUrl = url || this.previewMediaUrl();
    if (!mediaUrl) return;

    // Close menu if sharing from thumbnail
    if (url) {
      this.closeMenu();
    }

    try {
      await navigator.clipboard.writeText(mediaUrl);
      // You can add a toast notification here if you have a notification service
    } catch (error) {
      console.error('Failed to copy link to clipboard:', error);
      // Fallback: try to select and copy the text
      try {
        const textArea = document.createElement('textarea');
        textArea.value = mediaUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    }
  }

  /**
   * Toggle share menu (or use native share if available)
   */
  async toggleShareMenu() {
    // Try to use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${this.getDisplayName()} - Castrole Profile`,
          text: `Check out ${this.getDisplayName()}'s profile on Castrole`,
          url: this.getShareableProfileUrl(),
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to custom share menu
      this.isShareMenuOpen.set(!this.isShareMenuOpen());
    }
  }

  /**
   * Close share menu
   */
  closeShareMenu() {
    this.isShareMenuOpen.set(false);
  }

  /**
   * Copy profile URL to clipboard
   */
  async copyProfileUrl() {
    try {
      const url = this.getShareableProfileUrl();
      await navigator.clipboard.writeText(url);

      this.closeShareMenu();
    } catch (error) {
      console.error('Failed to copy profile URL to clipboard:', error);
      // Fallback: try to select and copy the text
      try {
        const textArea = document.createElement('textarea');
        textArea.value = this.getShareableProfileUrl();
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        this.closeShareMenu();
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    }
  }

  /**
   * Share on Twitter/X
   */
  shareOnTwitter() {
    const url = encodeURIComponent(this.getShareableProfileUrl());
    const text = encodeURIComponent(
      `Check out ${this.getDisplayName()}'s profile on Castrole`
    );
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      '_blank'
    );
    this.closeShareMenu();
  }

  /**
   * Share on Facebook
   */
  shareOnFacebook() {
    const url = encodeURIComponent(this.getShareableProfileUrl());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank'
    );
    this.closeShareMenu();
  }

  /**
   * Share on LinkedIn
   */
  shareOnLinkedIn() {
    const url = encodeURIComponent(this.getShareableProfileUrl());
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank'
    );
    this.closeShareMenu();
  }

  /**
   * Share on WhatsApp
   */
  shareOnWhatsApp() {
    const url = encodeURIComponent(this.getShareableProfileUrl());
    const text = encodeURIComponent(
      `Check out ${this.getDisplayName()}'s profile on Castrole: `
    );
    window.open(`https://wa.me/?text=${text}${url}`, '_blank');
    this.closeShareMenu();
  }

  /**
   * Show delete confirmation dialog (works for both modal and thumbnails)
   */
  showDeleteConfirmation(url?: string, type?: 'image' | 'video') {
    const mediaUrl = url || this.previewMediaUrl();
    const mediaType = type || this.previewMediaType();
    if (!mediaUrl) return;

    // Close menu if deleting from thumbnail
    if (url) {
      this.closeMenu();
    }

    this.pendingDeleteUrl.set(mediaUrl);
    this.pendingDeleteType.set(mediaType);
    this.isDeleteConfirmationOpen.set(true);
  }

  /**
   * Cancel delete operation
   */
  cancelDelete() {
    this.isDeleteConfirmationOpen.set(false);
    this.pendingDeleteUrl.set(null);
  }

  /**
   * Confirm and execute delete operation
   */
  async confirmDelete() {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    const mediaUrl = this.pendingDeleteUrl();
    const mediaType = this.pendingDeleteType();
    if (!mediaUrl) return;

    // Close confirmation dialog
    this.isDeleteConfirmationOpen.set(false);

    try {
      // Extract the storage path from the URL
      const storagePath = this.extractStoragePathFromUrl(mediaUrl);
      if (!storagePath) {
        console.error('Could not extract storage path from URL:', mediaUrl);
        alert('Failed to delete media. Could not parse storage path.');
        return;
      }

      console.log('Deleting from path:', storagePath);

      // Delete from Firebase Storage
      const storageRef = ref(this.storage, storagePath);
      await deleteObject(storageRef);

      // If it's a video, also delete the entire video folder
      if (mediaType === 'video') {
        // Extract video folder path (everything before /1080p.mp4)
        const videoFolderPath = storagePath.replace('/1080p.mp4', '');
        try {
          const videoFolderRef = ref(this.storage, videoFolderPath);
          const folderContents = await listAll(videoFolderRef);

          // Delete all files in the folder
          await Promise.all(
            folderContents.items.map((item) => deleteObject(item))
          );
        } catch (error) {
          console.warn('Could not delete entire video folder:', error);
        }
      }

      // Update local state by removing the URL from the appropriate array
      if (mediaType === 'video') {
        const updatedVideos = this.videoData().filter(
          (v) => v.url !== mediaUrl
        );
        this.videoData.set(updatedVideos);
      } else {
        const updatedImages = this.imageUrls().filter(
          (url) => url !== mediaUrl
        );
        this.imageUrls.set(updatedImages);
      }

      // Close the modal
      this.closePreviewModal();

      console.log(`${mediaType} deleted successfully`);
    } catch (error) {
      console.error('Error deleting media:', error);
      alert(`Failed to delete ${mediaType}. Please try again.`);
    }
  }

  /**
   * Extract Firebase Storage path from download URL
   * Handles both formats:
   * - https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=...
   * - gs://bucket/path/to/file
   */
  private extractStoragePathFromUrl(url: string): string | null {
    try {
      // Try to parse as HTTP/HTTPS URL first
      if (url.startsWith('http')) {
        const urlObj = new URL(url);

        // Check if it's a Firebase Storage URL
        if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
          // Extract path from /v0/b/{bucket}/o/{encodedPath}
          const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/);
          if (pathMatch && pathMatch[1]) {
            // Decode the path (URL encoded)
            // Remove query parameters if any
            const encodedPath = pathMatch[1].split('?')[0];
            return decodeURIComponent(encodedPath);
          }
        }

        // Try alternate format
        const altMatch = urlObj.pathname.match(/\/o\/(.+)/);
        if (altMatch && altMatch[1]) {
          const encodedPath = altMatch[1].split('?')[0];
          return decodeURIComponent(encodedPath);
        }
      }

      // Try gs:// format
      if (url.startsWith('gs://')) {
        const gsMatch = url.match(/^gs:\/\/[^\/]+\/(.+)/);
        if (gsMatch && gsMatch[1]) {
          return gsMatch[1];
        }
      }

      console.error('Could not match URL pattern:', url);
      return null;
    } catch (error) {
      console.error('Error extracting storage path from URL:', error, url);
      return null;
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

  // Helper methods to get education and works based on role
  getEducationList() {
    const profile = this.profileData();
    if (this.isActor()) {
      return profile?.actorProfile?.listEducation || [];
    } else {
      return profile?.producerProfile?.listEducation || [];
    }
  }

  getWorksList() {
    const profile = this.profileData();
    if (this.isActor()) {
      return profile?.actorProfile?.actorWorks || [];
    } else {
      return profile?.producerProfile?.producerWorks || [];
    }
  }

  /**
   * Get the profile URL for the current profile
   * Returns the slug format URL
   */
  getProfileUrl(): string {
    const profile = this.profileData();

    if (!profile || !profile.slug) {
      return '/discover/profile';
    }

    return this.profileUrlService.generateProfileUrl(profile.slug);
  }

  /**
   * Get the full shareable URL for the current profile
   */
  getShareableProfileUrl(): string {
    const profilePath = this.getProfileUrl();
    return `${window.location.origin}${profilePath}`;
  }

  /**
   * Check if the current user has blocked the profile user
   */
  async checkBlockStatus() {
    const currentUser = this.auth.getCurrentUser();
    const targetId = this.targetUserId();

    if (!currentUser || !targetId || this.isViewingOwnProfile()) {
      this.isUserBlocked.set(false);
      return;
    }

    try {
      const isBlocked = await this.blockService.isUserBlockedAsync(
        currentUser.uid,
        targetId
      );
      this.isUserBlocked.set(isBlocked);
    } catch (error) {
      console.error('Error checking block status:', error);
      this.isUserBlocked.set(false);
    }
  }

  /**
   * Block the user
   */
  async blockUser() {
    const currentUser = this.auth.getCurrentUser();
    const targetId = this.targetUserId();

    if (!currentUser || !targetId) return;

    try {
      await this.blockService.blockUser(currentUser.uid, targetId);
      this.isUserBlocked.set(true);
      this.showBlockMenu.set(false);
      alert('User has been blocked');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  }

  /**
   * Unblock the user
   */
  async unblockUser() {
    const currentUser = this.auth.getCurrentUser();
    const targetId = this.targetUserId();

    if (!currentUser || !targetId) return;

    try {
      await this.blockService.unblockUser(currentUser.uid, targetId);
      this.isUserBlocked.set(false);
      alert('User has been unblocked');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  }

  /**
   * Connect with the user (initiate chat)
   * Only available for producers viewing actor profiles
   * Opens the chat room directly after creation
   */
  async connectWithUser() {
    const currentUser = this.auth.getCurrentUser();
    const targetId = this.targetUserId();

    if (!currentUser || !targetId || this.isConnecting()) {
      return;
    }

    // Check if current user is a producer
    const currentUserDoc = await getDoc(
      doc(this.firestore, 'users', currentUser.uid)
    );
    if (!currentUserDoc.exists()) {
      return;
    }

    const currentUserData = currentUserDoc.data() as UserDoc;
    if (currentUserData.currentRole !== 'producer') {
      return;
    }

    this.isConnecting.set(true);

    try {
      // Create chat room without sending initial message
      const roomId = await this.chatService.producerStartChat(
        targetId,
        currentUser.uid
      );

      // Store the room ID in localStorage so chat component opens it directly
      try {
        localStorage.setItem('chat:lastRoomId', roomId);
      } catch (storageError) {
        console.warn('Could not save room ID to localStorage:', storageError);
      }

      // Navigate to chat page - it will automatically open the stored room
      this.router.navigate(['/discover/chat']);
    } catch (error) {
      console.error('Error connecting with user:', error);
    } finally {
      this.isConnecting.set(false);
    }
  }

  /**
   * Format height to ensure it has 'cm' suffix
   */
  formatHeight(height: string | undefined): string {
    if (!height) return '';

    // If already has cm suffix, return as is
    if (height.toLowerCase().includes('cm')) {
      return height;
    }

    // Otherwise, add cm suffix
    return `${height} cm`;
  }

  /**
   * Format weight to ensure it has 'kg' suffix
   */
  formatWeight(weight: string | undefined): string {
    if (!weight) return '';

    // If already has kg suffix, return as is
    if (weight.toLowerCase().includes('kg')) {
      return weight;
    }

    // Otherwise, add kg suffix
    return `${weight} kg`;
  }
}
