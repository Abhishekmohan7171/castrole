 import { Component, OnInit, OnDestroy, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, query, where, getDocs, DocumentData, doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, firstValueFrom } from 'rxjs';
import { Profile, ActorProfile } from '../../assets/interfaces/profile.interfaces';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { LoggerService } from '../services/logger.service';
import { ProfileUrlService } from '../services/profile-url.service';
import { AnalyticsService } from '../services/analytics.service';
import { BlockService } from '../services/block.service';
import { FilterPersistenceService } from '../services/filter-persistence.service';
import { CHARACTER_TYPES, GENDER_OPTIONS, AVAILABLE_SKILLS, AVAILABLE_LANGUAGES } from './search-constants';

interface ActorSearchResult {
  uid: string;
  slug?: string; // Stored slug from profile
  stageName: string;
  age?: string;
  gender?: string;
  location?: string;
  height?: string;
  weight?: string;
  skills?: string[];
  languages?: string[];
  profileImageUrl?: string;
  carouselImages?: string[];
  voiceIntroUrl?: string;
  profileViewCount?: number;
  wishlistCount?: number;
  // For search relevance
  relevanceScore?: number;
}

interface SearchFilters {
  characterTypes: string[];  // Multi-select character types
  minAge: number;
  maxAge: number;
  gender: string;
  minHeight: number;  // Min height in cm
  maxHeight: number;  // Max height in cm
  minWeight: number;  // Min weight in kg
  maxWeight: number;  // Max weight in kg
  languages: string[];
  skills: string[];
  location: string;
}

interface ParsedSearchQuery {
  ageRange?: { min: number; max: number };
  gender?: string;
  skills?: string[];
  physicalTraits?: string[];
  keywords?: string[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-transparent text-neutral-200">
      <!-- Search Bar -->
      <div class="sticky top-0 z-30 bg-transparent backdrop-blur-md border-b border-neutral-800/30">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Describe your character — e.g. 25-year-old fair boy with boxing skills"
              class="w-full bg-white/5 border border-neutral-700/50 rounded-xl px-6 py-4 pr-24 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#90ACC8] focus:bg-white/10 transition-colors">
            
            <!-- Voice and AI icons -->
            <div class="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
              <button class="p-2 rounded-lg hover:bg-white/10 transition-colors text-neutral-400 hover:text-[#90ACC8]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <!-- Smart Search (AI) - Locked -->
              <button 
                class="p-2 rounded-lg bg-neutral-700 cursor-not-allowed relative group"
                disabled
                title="Coming Soon">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <!-- Tooltip -->
                <span class="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-neutral-700">
                  AI Smart Search - Coming Soon
                </span>
              </button>
            </div>
          </div>

          <!-- Search Tags -->
          @if (searchTags().length > 0) {
            <div class="flex flex-wrap gap-2 mt-3">
              @for (tag of searchTags(); track tag) {
                <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-sm text-neutral-300">
                  {{ tag }}
                  <button (click)="removeTag(tag)" class="hover:text-fuchsia-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Filters Sidebar -->
          <aside class="lg:col-span-1">
            <div class="sticky top-32 bg-neutral-900 rounded-xl border border-neutral-800 p-6">
              <h2 class="text-lg font-semibold text-neutral-100 mb-6">Filters</h2>

              <!-- Character Types (Searchable Multi-select) -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">
                  Character Types
                  @if (filters().characterTypes.length > 0) {
                    <span class="ml-2 text-xs text-fuchsia-400">({{ filters().characterTypes.length }} selected)</span>
                  }
                </label>
                
                <!-- Search Input -->
                <div class="relative">
                  <input
                    type="text"
                    [value]="characterTypeSearch()"
                    (input)="onCharacterTypeSearchChange($any($event.target).value)"
                    (focus)="showCharacterTypeDropdown.set(true)"
                    (blur)="onCharacterTypeBlur()"
                    placeholder="Search character types..."
                    class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-sm focus:outline-none focus:border-fuchsia-500 mb-2">
                  
                  <!-- Dropdown List -->
                  @if (showCharacterTypeDropdown() && filteredCharacterTypes().length > 0) {
                    <div 
                      (mousedown)="$event.preventDefault()"
                      class="absolute z-10 w-full max-h-48 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-lg p-2 space-y-1 shadow-xl">
                      @for (type of filteredCharacterTypes(); track type) {
                        <label class="flex items-center gap-2 cursor-pointer hover:bg-neutral-700 px-2 py-1.5 rounded transition-colors">
                          <input 
                            type="checkbox"
                            [checked]="filters().characterTypes.includes(type)"
                            (change)="toggleCharacterType(type)"
                            class="w-4 h-4 rounded border-neutral-600 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-0 bg-neutral-700 cursor-pointer">
                          <span class="text-sm text-neutral-200 capitalize">{{ type }}</span>
                        </label>
                      }
                    </div>
                  }
                </div>
                
                <!-- Selected Types Tags -->
                @if (filters().characterTypes.length > 0) {
                  <div class="flex flex-wrap gap-1.5">
                    @for (type of filters().characterTypes; track type) {
                      <span class="inline-flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-300 px-2 py-1 rounded text-xs capitalize">
                        {{ type }}
                        <button (click)="toggleCharacterType(type)" class="hover:text-fuchsia-100">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    }
                  </div>
                }
              </div>

              <!-- Age Range -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Age</label>
                <div class="flex items-center gap-3">
                  <input 
                    type="number" 
                    [value]="filters().minAge"
                    (input)="updateFilter('minAge', +$any($event.target).value)"
                    min="0" 
                    max="100"
                    class="w-20 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-center focus:outline-none focus:border-fuchsia-500">
                  <div class="flex-1 relative">
                    <input 
                      type="range" 
                      [value]="filters().maxAge"
                      (input)="updateFilter('maxAge', +$any($event.target).value)"
                      min="0" 
                      max="100"
                      class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#90ACC8]">
                  </div>
                  <span class="w-12 text-center text-neutral-300">{{ filters().maxAge }}</span>
                </div>
              </div>

              <!-- Gender -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Gender</label>
                <select 
                  [value]="filters().gender"
                  (change)="updateFilter('gender', $any($event.target).value)"
                  class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-fuchsia-500">
                  @for (option of genderOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </div>

              <!-- Height Range (cm) -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Height (cm)</label>
                <div class="flex items-center gap-3">
                  <input 
                    type="number" 
                    [value]="filters().minHeight"
                    (input)="updateFilter('minHeight', +$any($event.target).value)"
                    min="100" 
                    max="250"
                    class="w-16 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-neutral-200 text-center text-sm focus:outline-none focus:border-fuchsia-500">
                  <div class="flex-1 relative">
                    <input 
                      type="range" 
                      [value]="filters().maxHeight"
                      (input)="updateFilter('maxHeight', +$any($event.target).value)"
                      min="100" 
                      max="250"
                      class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#90ACC8]">
                  </div>
                  <span class="w-12 text-center text-neutral-300 text-sm">{{ filters().maxHeight }}</span>
                </div>
              </div>

              <!-- Weight Range (kg) -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Weight (kg)</label>
                <div class="flex items-center gap-3">
                  <input 
                    type="number" 
                    [value]="filters().minWeight"
                    (input)="updateFilter('minWeight', +$any($event.target).value)"
                    min="30" 
                    max="150"
                    class="w-16 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-neutral-200 text-center text-sm focus:outline-none focus:border-fuchsia-500">
                  <div class="flex-1 relative">
                    <input 
                      type="range" 
                      [value]="filters().maxWeight"
                      (input)="updateFilter('maxWeight', +$any($event.target).value)"
                      min="30" 
                      max="150"
                      class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#90ACC8]">
                  </div>
                  <span class="w-12 text-center text-neutral-300 text-sm">{{ filters().maxWeight }}</span>
                </div>
              </div>

              <!-- Skills -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Skills</label>
                <input
                  type="text"
                  [value]="skillsInput()"
                  (input)="onSkillsInputChange($any($event.target).value)"
                  (keyup.enter)="applyFilters()"
                  placeholder="e.g., Acting, Dancing, Boxing"
                  class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-fuchsia-500">
                <p class="text-xs text-neutral-500 mt-1">Separate multiple skills with commas</p>
              </div>

              <!-- Languages -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Languages</label>
                <input
                  type="text"
                  [value]="languageInput()"
                  (input)="onLanguageInputChange($any($event.target).value)"
                  (keyup.enter)="applyFilters()"
                  placeholder="e.g., English, Hindi, Tamil"
                  class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-fuchsia-500">
                <p class="text-xs text-neutral-500 mt-1">Separate multiple languages with commas</p>
              </div>

              <!-- Location -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Location</label>
                <input 
                  type="text" 
                  [value]="filters().location"
                  (input)="updateFilter('location', $any($event.target).value)"
                  placeholder="e.g., Mumbai, Chennai"
                  class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-fuchsia-500">
              </div>

              <!-- Filter Actions -->
              <div class="space-y-2">
                <button 
                  (click)="applyFilters()"
                  class="w-full bg-[#90ACC8] hover:bg-[#7A9AB8] text-white font-medium py-3 rounded-lg transition-colors">
                  Apply Filters
                  @if (hasActiveFilters()) {
                    <span class="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {{ getActiveFilterCount() }}
                    </span>
                  }
                </button>
                
                @if (hasActiveFilters()) {
                  <button 
                    (click)="clearFilters()"
                    class="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-2 rounded-lg transition-colors text-sm">
                    Clear All Filters
                  </button>
                }
              </div>
            </div>
          </aside>

          <!-- Actor Cards Grid -->
          <main class="lg:col-span-2">
            <!-- Active Filters Display -->
            @if (hasActiveFilters() || searchQuery()) {
              <div class="mb-4 flex items-center gap-2 flex-wrap">
                <span class="text-sm text-neutral-400">Active:</span>
                
                @if (searchQuery()) {
                  <span class="inline-flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-300 px-3 py-1 rounded-full text-sm">
                    Search: "{{ searchQuery() }}"
                    <button (click)="searchQuery.set('')" class="hover:text-fuchsia-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().characterTypes.length > 0) {
                  @for (type of filters().characterTypes; track type) {
                    <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm capitalize">
                      {{ type }}
                      <button (click)="toggleCharacterType(type)" class="hover:text-neutral-100">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </span>
                  }
                }
                
                @if (filters().gender !== 'any') {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Gender: {{ filters().gender }}
                    <button (click)="updateFilter('gender', 'any')" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().minAge !== 0 || filters().maxAge !== 100) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Age: {{ filters().minAge }}-{{ filters().maxAge }}
                    <button (click)="updateFilter('minAge', 0); updateFilter('maxAge', 100)" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().minHeight !== 140 || filters().maxHeight !== 200) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Height: {{ filters().minHeight }}-{{ filters().maxHeight }}cm
                    <button (click)="updateFilter('minHeight', 140); updateFilter('maxHeight', 200)" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().minWeight !== 40 || filters().maxWeight !== 120) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Weight: {{ filters().minWeight }}-{{ filters().maxWeight }}kg
                    <button (click)="updateFilter('minWeight', 40); updateFilter('maxWeight', 120)" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().skills.length > 0) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Skills: {{ filters().skills.join(', ') }}
                    <button (click)="updateFilter('skills', []); skillsInput.set('')" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().languages.length > 0) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Languages: {{ filters().languages.join(', ') }}
                    <button (click)="updateFilter('languages', []); languageInput.set('')" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().location) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Location: {{ filters().location }}
                    <button (click)="updateFilter('location', '')" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
              </div>
            }
            
            @if (loading()) {
              <!-- Loading State -->
              <div class="flex items-center justify-center py-20">
                <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-fuchsia-500 border-r-transparent"></div>
              </div>
            } @else if (error()) {
              <!-- Error State -->
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl font-semibold text-neutral-400 mb-2">{{ error() }}</h3>
                <button 
                  (click)="loadActors()" 
                  class="mt-4 px-6 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg transition-colors">
                  Retry
                </button>
              </div>
            } @else if (filteredActors().length > 0) {
              <!-- Results -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (actor of filteredActors(); track actor.uid) {
                  <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden hover:border-fuchsia-500/50 transition-all duration-300 group">
                    <!-- Circular Actor Photo -->
                    <div class="relative bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center py-6">
                      @if (actor.profileImageUrl) {
                        <img 
                          [src]="actor.profileImageUrl" 
                          [alt]="actor.stageName" 
                          class="w-24 h-24 rounded-full object-cover border-4 border-neutral-700 group-hover:border-fuchsia-500/50 transition-colors shadow-xl">
                      } @else {
                        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-3xl font-bold text-neutral-400 border-4 border-neutral-700 group-hover:border-fuchsia-500/50 transition-colors shadow-xl">
                          {{ actor.stageName.charAt(0).toUpperCase() }}
                        </div>
                      }
                    </div>

                    <!-- Actor Info -->
                    <div class="p-4">
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1 min-w-0">
                          <h3 class="text-base font-semibold text-neutral-100 truncate">{{ actor.stageName }}</h3>
                          <div class="flex items-center gap-2 text-sm text-neutral-400 mt-0.5">
                            @if (actor.age) {
                              <span>{{ actor.age }} yrs</span>
                            }
                            @if (actor.gender) {
                              <span>•</span>
                              <span class="capitalize">{{ actor.gender }}</span>
                            }
                          </div>
                        </div>
                        
                        <!-- Wishlist Button -->
                        <button 
                          (click)="toggleWishlist(actor)"
                          [class]="isInWishlist(actor) ? 'bg-fuchsia-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-fuchsia-400'"
                          class="p-2 rounded-lg transition-colors flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" [attr.fill]="isInWishlist(actor) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      @if (actor.location) {
                        <p class="text-xs text-neutral-500 mb-3 truncate">📍 {{ actor.location }}</p>
                      }

                      <!-- Voice Intro Player -->
                      @if (actor.voiceIntroUrl) {
                        <div class="mb-3 bg-neutral-800 rounded-lg p-2 flex items-center gap-2">
                          <button 
                            (click)="toggleVoicePlay(actor.uid)"
                            class="p-1.5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white transition-colors flex-shrink-0">
                            @if (playingVoiceId() === actor.uid) {
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                              </svg>
                            } @else {
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            }
                          </button>
                          <div class="flex-1 min-w-0">
                            <p class="text-xs text-neutral-400">Voice Intro</p>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      }

                      <!-- Skills/Tags -->
                      @if (actor.skills && actor.skills.length > 0) {
                        <div class="flex flex-wrap gap-1.5 mb-3">
                          @for (skill of actor.skills.slice(0, 3); track skill) {
                            <span class="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300">
                              {{ skill }}
                            </span>
                          }
                          @if (actor.skills.length > 3) {
                            <span class="px-2 py-1 text-xs text-neutral-500">
                              +{{ actor.skills.length - 3 }}
                            </span>
                          }
                        </div>
                      }

                      <!-- Actions -->
                      <button 
                        (click)="viewProfile(actor)"
                        class="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Profile
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else if (searchQuery() || hasActiveFilters()) {
              <!-- No Results State (only show if user has searched) -->
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-neutral-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 class="text-xl font-semibold text-neutral-400 mb-2">No actors found</h3>
                <p class="text-neutral-500">Try adjusting your search or filters</p>
              </div>
            } @else {
              <!-- Initial State -->
              <div class="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-fuchsia-500/20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 class="text-2xl font-semibold text-neutral-300 mb-3">Find Your Perfect Actor</h3>
                <p class="text-neutral-500 mb-2 max-w-md">
                  Describe the character you're looking for or use the filters to discover talented actors
                </p>
                <p class="text-sm text-neutral-600">
                  Try: "25-year-old male actor with boxing skills" or "tall actress who knows Tamil"
                </p>
              </div>
            }
          </main>

          <!-- Wishlist Sidebar -->
          <aside class="lg:col-span-1">
            <div class="sticky top-32 bg-neutral-900 rounded-xl border border-neutral-800 p-6">
              <h2 class="text-lg font-semibold text-neutral-100 mb-4">Wishlist</h2>

              @if (wishlistLoading()) {
                <!-- Loading State -->
                <div class="flex flex-col items-center justify-center py-12">
                  <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-fuchsia-500 border-r-transparent mb-3"></div>
                  <p class="text-sm text-neutral-400">Loading wishlist...</p>
                </div>
              } @else if (wishlist().length > 0) {
                <!-- Wishlist Items -->
                <div class="space-y-3 mb-4">
                  @for (actor of wishlist(); track actor.uid) {
                    <div class="flex items-center gap-3 p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors">
                      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm">
                        {{ actor.stageName.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-200 truncate">{{ actor.stageName }}</p>
                      </div>
                      <button 
                        (click)="toggleWishlist(actor)"
                        class="text-neutral-400 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>

                <button 
                  (click)="viewAllWishlist()"
                  class="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  View Profile
                </button>
              } @else {
                <!-- Empty State -->
                <div class="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p class="text-sm text-neutral-500 mb-1">No actors in wishlist</p>
                  <p class="text-xs text-neutral-600">
                    Click the heart icon to add actors
                  </p>
                </div>
              }
            </div>
          </aside>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Custom scrollbar for filters */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #171717;
    }
    ::-webkit-scrollbar-thumb {
      background: #404040;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #525252;
    }
  `]
})
export class SearchComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private profileUrlService = inject(ProfileUrlService);
  private analyticsService = inject(AnalyticsService);
  private blockService = inject(BlockService);
  private platformId = inject(PLATFORM_ID);
  private filterPersistence = inject(FilterPersistenceService);
  private destroy$ = new Subject<void>();
  private saveSubject = new Subject<void>();
  private currentUserId: string | null = null;
  private wishlistUnsubscribe: Unsubscribe | null = null;

  // Expose constants for template
  readonly characterTypes = CHARACTER_TYPES;
  readonly genderOptions = GENDER_OPTIONS;
  readonly availableSkills = AVAILABLE_SKILLS;
  readonly availableLanguages = AVAILABLE_LANGUAGES;

  // Search state
  searchQuery = signal('');
  searchTags = signal<string[]>([]);
  private searchSubject = new Subject<string>();
  parsedQuery = signal<ParsedSearchQuery>({});
  
  // Actors data
  allActors = signal<ActorSearchResult[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Pagination
  currentPage = signal(0);
  itemsPerPage = 20;
  hasMore = signal(false);
  
  // Filters
  filters = signal<SearchFilters>({
    characterTypes: [],  // Multi-select character types
    minAge: 0,
    maxAge: 100,
    gender: 'any',
    minHeight: 140,  // Min height in cm
    maxHeight: 200,  // Max height in cm
    minWeight: 40,   // Min weight in kg
    maxWeight: 120,  // Max weight in kg
    languages: [],
    skills: [],
    location: ''
  });
  
  // Temporary inputs for comma-separated fields
  languageInput = signal('');
  skillsInput = signal('');
  
  // Character type search
  characterTypeSearch = signal('');
  showCharacterTypeDropdown = signal(false);
  
  // Filtered character types based on search
  filteredCharacterTypes = computed(() => {
    const search = this.characterTypeSearch().toLowerCase().trim();
    if (!search) {
      return this.characterTypes;
    }
    return this.characterTypes.filter(type => 
      type.toLowerCase().includes(search)
    );
  });

  // Wishlist
  wishlist = signal<ActorSearchResult[]>([]);
  wishlistLoading = signal(false);

  // Voice player
  playingVoiceId = signal<string | null>(null);
  private audioElement: HTMLAudioElement | null = null;

  // Computed filtered actors with advanced logic
  filteredActors = computed(() => {
    const searchText = this.searchQuery().toLowerCase();
    const currentFilters = this.filters();
    const parsed = this.parsedQuery();

    // Don't show results if no search query and default filters
    const hasSearchQuery = searchText.trim().length > 0;
    const hasNonDefaultFilters = 
      currentFilters.characterTypes.length > 0 ||
      currentFilters.gender !== 'any' ||
      currentFilters.minAge !== 0 ||
      currentFilters.maxAge !== 100 ||
      currentFilters.minHeight !== 140 ||
      currentFilters.maxHeight !== 200 ||
      currentFilters.minWeight !== 40 ||
      currentFilters.maxWeight !== 120 ||
      currentFilters.languages.length > 0 ||
      currentFilters.skills.length > 0 ||
      currentFilters.location !== '';

    if (!hasSearchQuery && !hasNonDefaultFilters) {
      this.logger.log('No search query or filters active');
      return [];
    }

    let actors = this.allActors();
    this.logger.log(`Filtering ${actors.length} total actors with query: "${searchText}"`);

    // Apply smart search across all profile fields
    if (searchText) {
      actors = actors.filter(actor => {
        const matchesName = actor.stageName?.toLowerCase().includes(searchText);
        const matchesSkills = actor.skills?.some(skill => 
          typeof skill === 'string' && skill.toLowerCase().includes(searchText)
        );
        const matchesLanguages = actor.languages?.some(lang => 
          typeof lang === 'string' && lang.toLowerCase().includes(searchText)
        );
        const matchesLocation = actor.location?.toLowerCase().includes(searchText);
        const matchesGender = actor.gender?.toLowerCase().includes(searchText);
        const matchesAge = actor.age?.toString().includes(searchText);
        
        return matchesName || matchesSkills || matchesLanguages || 
               matchesLocation || matchesGender || matchesAge;
      });

      // Calculate relevance scores
      actors = actors.map(actor => ({
        ...actor,
        relevanceScore: this.calculateRelevance(actor, searchText, parsed)
      }));

      // Sort by relevance
      actors.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    // Apply gender filter
    if (currentFilters.gender !== 'any') {
      const beforeCount = actors.length;
      actors = actors.filter(actor => 
        actor.gender?.toLowerCase() === currentFilters.gender.toLowerCase()
      );
      this.logger.log(`Gender filter (${currentFilters.gender}): ${beforeCount} → ${actors.length} actors`);
    }

    // Apply age range filter (only if changed from defaults)
    const hasAgeFilter = currentFilters.minAge !== 0 || currentFilters.maxAge !== 100;
    if (hasAgeFilter) {
      const beforeCount = actors.length;
      actors = actors.filter(actor => {
        const age = parseInt(actor.age || '0');
        return age >= currentFilters.minAge && age <= currentFilters.maxAge;
      });
      this.logger.log(`Age filter (${currentFilters.minAge}-${currentFilters.maxAge}): ${beforeCount} → ${actors.length} actors`);
    }

    // Apply height range filter
    const hasHeightFilter = currentFilters.minHeight !== 140 || currentFilters.maxHeight !== 200;
    if (hasHeightFilter) {
      const beforeCount = actors.length;
      actors = actors.filter(actor => {
        const actorHeightCm = this.parseHeightToCm(actor.height || '');
        return actorHeightCm >= currentFilters.minHeight && actorHeightCm <= currentFilters.maxHeight;
      });
      this.logger.log(`Height filter (${currentFilters.minHeight}-${currentFilters.maxHeight}cm): ${beforeCount} → ${actors.length} actors`);
    }

    // Apply weight range filter
    const hasWeightFilter = currentFilters.minWeight !== 40 || currentFilters.maxWeight !== 120;
    if (hasWeightFilter) {
      const beforeCount = actors.length;
      actors = actors.filter(actor => {
        const actorWeight = parseInt(actor.weight || '0');
        return actorWeight >= currentFilters.minWeight && actorWeight <= currentFilters.maxWeight;
      });
      this.logger.log(`Weight filter (${currentFilters.minWeight}-${currentFilters.maxWeight}kg): ${beforeCount} → ${actors.length} actors`);
    }

    // Apply skills filter
    if (currentFilters.skills.length > 0) {
      const beforeCount = actors.length;
      actors = actors.filter(actor => {
        return currentFilters.skills.some(skill => 
          actor.skills?.some(actorSkill => 
            typeof actorSkill === 'string' && typeof skill === 'string' &&
            actorSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
      this.logger.log(`Skills filter (${currentFilters.skills.join(', ')}): ${beforeCount} → ${actors.length} actors`);
    }

    // Apply languages filter
    if (currentFilters.languages.length > 0) {
      const beforeCount = actors.length;
      actors = actors.filter(actor => {
        return currentFilters.languages.some(lang => 
          actor.languages?.some(actorLang => 
            typeof actorLang === 'string' && typeof lang === 'string' &&
            actorLang.toLowerCase().includes(lang.toLowerCase())
          )
        );
      });
      this.logger.log(`Languages filter (${currentFilters.languages.join(', ')}): ${beforeCount} → ${actors.length} actors`);
    }

    // Apply location filter
    if (currentFilters.location) {
      const beforeCount = actors.length;
      const locationQuery = currentFilters.location.toLowerCase();
      actors = actors.filter(actor => 
        actor.location?.toLowerCase().includes(locationQuery)
      );
      this.logger.log(`Location filter (${currentFilters.location}): ${beforeCount} → ${actors.length} actors`);
    }

    this.logger.log(`Filtered results: ${actors.length} actors found`);
    return actors;
  });

  ngOnInit(): void {
    // Get current user
    this.currentUserId = this.auth.currentUser?.uid || null;

    // Set wishlist loading if user is logged in
    if (this.currentUserId) {
      this.wishlistLoading.set(true);
    }

    // Restore saved filters from localStorage (SSR-safe)
    // TODO: Update FilterPersistenceService to match new SearchFilters interface
    // if (isPlatformBrowser(this.platformId)) {
    //   const savedState = this.filterPersistence.loadFilters();
    //   this.filters.set(savedState.filters);
    //   this.searchQuery.set(savedState.searchQuery);
    //   this.languageInput.set(savedState.languageInput);
    //   this.skillsInput.set(savedState.skillsInput);
    //   this.logger.log('Restored filters from localStorage:', savedState);
    // }

    // Setup auto-save for filter changes
    this.setupAutoSave();

    // Load actors in background but don't display until search
    // Wishlist will be loaded after actors are loaded
    this.loadActors();
    this.setupSearchDebounce();
  }

  /**
   * Setup debounced auto-save for filter changes
   * Saves filters after 300ms of inactivity to reduce localStorage writes
   */
  private setupAutoSave(): void {
    this.saveSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.persistFilters();
    });
  }

  /**
   * Persist current filter state to localStorage
   */
  private persistFilters(): void {
    // TODO: Update FilterPersistenceService to match new SearchFilters interface
    // if (isPlatformBrowser(this.platformId)) {
    //   this.filterPersistence.saveFilters({
    //     filters: this.filters(),
    //     searchQuery: this.searchQuery(),
    //     languageInput: this.languageInput(),
    //     skillsInput: this.skillsInput()
    //   });
    //   this.logger.log('Saved filters to localStorage');
    // }
  }

  ngOnDestroy(): void {
    // Save filters before destroying component
    this.persistFilters();

    // Cleanup subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
    this.saveSubject.complete();

    // Unsubscribe from wishlist listener
    if (this.wishlistUnsubscribe) {
      this.wishlistUnsubscribe();
    }
  }

  /**
   * Load actors from profiles collection
   * First gets actor UIDs from users collection, then fetches full profiles
   */
  async loadActors(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      // Step 1: Get all actor UIDs from users collection
      const usersRef = collection(this.firestore, 'users');
      const usersQuery = query(usersRef, where('currentRole', '==', 'actor'));
      const userDocs = await getDocs(usersQuery);
      
      const actorUids = userDocs.docs.map(doc => doc.id);
      this.logger.log(`Found ${actorUids.length} actors`);

      if (actorUids.length === 0) {
        this.allActors.set([]);
        this.loading.set(false);
        return;
      }

      // Step 2: Batch fetch profiles (Firestore 'in' query limit is 10)
      const actors: ActorSearchResult[] = [];
      
      for (let i = 0; i < actorUids.length; i += 10) {
        const batch = actorUids.slice(i, i + 10);
        const profilesRef = collection(this.firestore, 'profiles');
        const profilesQuery = query(profilesRef, where('uid', 'in', batch));
        const profileDocs = await getDocs(profilesQuery);
        
        profileDocs.forEach((doc) => {
          const profile = doc.data() as Profile;
          const actorResult = this.transformProfileToSearchResult(profile);
          if (actorResult) {
            actors.push(actorResult);
          }
        });
      }
      
      this.logger.log(`Loaded ${actors.length} actor profiles`);

      // Filter out blocked users if current user is logged in
      let filteredActors = actors;
      if (this.currentUserId) {
        const blockedUserIds = await firstValueFrom(this.blockService.getBlockedUserIds(this.currentUserId));
        if (blockedUserIds && blockedUserIds.length > 0) {
          filteredActors = actors.filter(actor => !blockedUserIds.includes(actor.uid));
          this.logger.log(`Filtered ${actors.length - filteredActors.length} blocked actors`);
        }
      }

      this.allActors.set(filteredActors);

      // Setup real-time wishlist listener after actors are loaded
      if (this.currentUserId) {
        this.setupWishlistListener();
      }
      
    } catch (err) {
      const errorMsg = 'Failed to load actors. Please try again.';
      this.error.set(errorMsg);
      this.logger.error('Error loading actors:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Transform Profile document to ActorSearchResult
   */
  private transformProfileToSearchResult(profile: Profile): ActorSearchResult | null {
    if (!profile.actorProfile) {
      this.logger.log('Profile missing actorProfile:', profile.uid);
      return null;
    }

    const actor = profile.actorProfile;
    
    // Extract skill names from Skill[] objects: { skill: string, rating: number }
    const extractSkills = (skills: any[] | undefined): string[] => {
      if (!Array.isArray(skills)) return [];
      return skills
        .map(item => {
          if (typeof item === 'object' && item !== null && 'skill' in item) {
            return item.skill;
          }
          if (typeof item === 'string') {
            return item;
          }
          return null;
        })
        .filter((skill): skill is string => skill !== null && skill.length > 0);
    };
    
    // Extract language names from Language[] objects: { language: string, rating: number }
    const extractLanguages = (languages: any[] | undefined): string[] => {
      if (!Array.isArray(languages)) return [];
      return languages
        .map(item => {
          if (typeof item === 'object' && item !== null && 'language' in item) {
            return item.language;
          }
          if (typeof item === 'string') {
            return item;
          }
          return null;
        })
        .filter((lang): lang is string => lang !== null && lang.length > 0);
    };
    
    const result: ActorSearchResult = {
      uid: profile.uid,
      slug: profile.slug, // Include stored slug
      stageName: actor.stageName || 'Unknown',
      age: profile.age,
      gender: profile.gender,
      location: profile.location,
      height: actor.height,
      weight: actor.weight,
      skills: extractSkills(actor.skills),
      languages: extractLanguages(actor.languages),
      profileImageUrl: actor.actorProfileImageUrl,
      carouselImages: actor.carouselImagesUrl || [],
      voiceIntroUrl: actor.voiceIntro,
      profileViewCount: actor.profileViewCount || 0,
      wishlistCount: actor.wishListCount || 0
    };
    
    this.logger.log('Transformed actor:', result.stageName, result);
    return result;
  }

  /**
   * Setup debounced search with RxJS
   */
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      this.parseSearchQuery(query);
      this.extractSearchTags(query);
    });
  }

  onSearchChange(): void {
    const query = this.searchQuery();
    this.searchSubject.next(query);
    // Trigger debounced save for search query
    this.saveSubject.next();
  }

  /**
   * Parse natural language search query
   * Examples:
   * - "25-year-old fair boy with boxing skills" → age:25, gender:male, skills:[boxing]
   * - "tall female actor who knows Tamil" → gender:female, languages:[Tamil]
   */
  private parseSearchQuery(query: string): void {
    const parsed: ParsedSearchQuery = {};
    const lowerQuery = query.toLowerCase();

    // Extract age patterns
    const agePatterns = [
      /(\d{2})[-\s]?year[-\s]?old/i,
      /age[:\s]+(\d{2})/i,
      /(\d{2})\s*yo/i
    ];
    
    for (const pattern of agePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        parsed.ageRange = { min: age - 2, max: age + 2 };
        break;
      }
    }

    // Extract gender
    if (lowerQuery.includes('male') && !lowerQuery.includes('female')) {
      parsed.gender = 'male';
    } else if (lowerQuery.includes('female')) {
      parsed.gender = 'female';
    } else if (lowerQuery.includes('boy') || lowerQuery.includes('man')) {
      parsed.gender = 'male';
    } else if (lowerQuery.includes('girl') || lowerQuery.includes('woman')) {
      parsed.gender = 'female';
    }

    // Extract skills (common acting skills)
    const skillKeywords = [
      'acting', 'boxing', 'dancing', 'singing', 'martial arts', 'gymnastics',
      'swimming', 'horse riding', 'stunt', 'comedy', 'drama', 'action'
    ];
    
    parsed.skills = skillKeywords.filter(skill => 
      lowerQuery.includes(skill)
    );

    // Extract physical traits
    const traitKeywords = [
      'tall', 'short', 'fair', 'dark', 'athletic', 'slim', 'muscular'
    ];
    
    parsed.physicalTraits = traitKeywords.filter(trait => 
      lowerQuery.includes(trait)
    );

    // Extract remaining keywords
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const excludeWords = [
      'with', 'who', 'knows', 'year', 'old', 'and', 'the', 'actor', 'actress'
    ];
    
    parsed.keywords = words.filter(w => 
      !excludeWords.includes(w.toLowerCase()) &&
      !skillKeywords.includes(w.toLowerCase()) &&
      !traitKeywords.includes(w.toLowerCase())
    );

    this.parsedQuery.set(parsed);
    this.logger.log('Parsed search query:', parsed);
  }

  /**
   * Extract visual tags from search query
   */
  private extractSearchTags(query: string): void {
    const parsed = this.parsedQuery();
    const tags: string[] = [];

    if (parsed.gender) {
      tags.push(parsed.gender);
    }

    if (parsed.ageRange) {
      tags.push(`${parsed.ageRange.min}-${parsed.ageRange.max} years`);
    }

    if (parsed.skills && parsed.skills.length > 0) {
      tags.push(...parsed.skills.slice(0, 3));
    }

    if (parsed.physicalTraits && parsed.physicalTraits.length > 0) {
      tags.push(...parsed.physicalTraits.slice(0, 2));
    }

    this.searchTags.set(tags.slice(0, 5)); // Limit to 5 tags
  }

  /**
   * Calculate relevance score for search ranking
   */
  private calculateRelevance(
    actor: ActorSearchResult, 
    searchText: string, 
    parsed: ParsedSearchQuery
  ): number {
    let score = 0;

    // Exact name match is highest priority
    if (actor.stageName?.toLowerCase() === searchText) {
      score += 100;
    } else if (actor.stageName?.toLowerCase().includes(searchText)) {
      score += 50;
    }

    // Skills match
    if (parsed.skills && parsed.skills.length > 0) {
      const matchingSkills = actor.skills?.filter(skill =>
        typeof skill === 'string' && 
        parsed.skills!.some(s => skill.toLowerCase().includes(s))
      ).length || 0;
      score += matchingSkills * 20;
    }

    // Age match
    if (parsed.ageRange) {
      const actorAge = parseInt(actor.age || '0');
      if (actorAge >= parsed.ageRange.min && actorAge <= parsed.ageRange.max) {
        score += 30;
      }
    }

    // Gender match
    if (parsed.gender && actor.gender?.toLowerCase() === parsed.gender) {
      score += 25;
    }

    // Popular actors boost (based on view count)
    score += Math.min((actor.profileViewCount || 0) / 10, 10);

    // Wishlist count boost
    score += Math.min((actor.wishlistCount || 0) / 5, 5);

    return score;
  }

  /**
   * Parse height string to cm (e.g., "5'8\"", "5 feet 8 inches", "173cm", "173")
   */
  private parseHeightToCm(height: string): number {
    if (!height) return 0;

    // Try cm format first (e.g., "173cm" or "173")
    const cmMatch = height.match(/(\d+)\s*cm/i);
    if (cmMatch) {
      return parseInt(cmMatch[1]);
    }

    // Try pure number (assume cm)
    const numberMatch = height.match(/^(\d+)$/);
    if (numberMatch) {
      const value = parseInt(numberMatch[1]);
      // If value is reasonable for cm (100-250), use it
      if (value >= 100 && value <= 250) {
        return value;
      }
    }

    // Try feet'inches" format (e.g., "5'8\"" or "5'8")
    const feetInchesMatch = height.match(/(\d+)'\s*(\d+)/);
    if (feetInchesMatch) {
      const feet = parseInt(feetInchesMatch[1]);
      const inches = parseInt(feetInchesMatch[2]);
      const totalInches = feet * 12 + inches;
      return Math.round(totalInches * 2.54); // Convert inches to cm
    }

    // Try "X feet Y inches" format
    const feetWordsMatch = height.match(/(\d+)\s*(?:feet|ft)\s*(\d+)\s*(?:inches|in)/i);
    if (feetWordsMatch) {
      const feet = parseInt(feetWordsMatch[1]);
      const inches = parseInt(feetWordsMatch[2]);
      const totalInches = feet * 12 + inches;
      return Math.round(totalInches * 2.54); // Convert inches to cm
    }

    return 0;
  }

  removeTag(tag: string): void {
    const currentTags = this.searchTags();
    this.searchTags.set(currentTags.filter(t => t !== tag));
    
    // Update search query
    const query = this.searchQuery();
    const newQuery = query.replace(tag, '').trim();
    this.searchQuery.set(newQuery);
  }

  /**
   * Check if any non-default filters are active
   */
  hasActiveFilters(): boolean {
    const currentFilters = this.filters();
    return (
      currentFilters.characterTypes.length > 0 ||
      currentFilters.gender !== 'any' ||
      currentFilters.minAge !== 0 ||
      currentFilters.maxAge !== 100 ||
      currentFilters.minHeight !== 140 ||
      currentFilters.maxHeight !== 200 ||
      currentFilters.minWeight !== 40 ||
      currentFilters.maxWeight !== 120 ||
      currentFilters.languages.length > 0 ||
      currentFilters.skills.length > 0 ||
      currentFilters.location !== ''
    );
  }

  /**
   * Update a specific filter property
   */
  updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]): void {
    this.filters.set({
      ...this.filters(),
      [key]: value
    });
    this.logger.log(`Filter updated: ${key} = ${value}`);
    // Trigger debounced save
    this.saveSubject.next();
  }

  /**
   * Toggle character type in multi-select
   */
  toggleCharacterType(type: string): void {
    const currentTypes = this.filters().characterTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    this.updateFilter('characterTypes', newTypes);
    this.logger.log(`Character type toggled: ${type}, now selected: ${newTypes.length}`);
  }

  /**
   * Handle character type search input changes
   */
  onCharacterTypeSearchChange(value: string): void {
    this.characterTypeSearch.set(value);
    // Show dropdown when user types
    if (value.trim().length > 0) {
      this.showCharacterTypeDropdown.set(true);
    }
  }

  /**
   * Handle character type input blur
   * Delay closing to allow checkbox clicks
   */
  onCharacterTypeBlur(): void {
    setTimeout(() => {
      this.showCharacterTypeDropdown.set(false);
    }, 200);
  }

  /**
   * Handle language input changes
   */
  onLanguageInputChange(value: string): void {
    this.languageInput.set(value);
    // Trigger debounced save
    this.saveSubject.next();
  }

  /**
   * Handle skills input changes
   */
  onSkillsInputChange(value: string): void {
    this.skillsInput.set(value);
    // Trigger debounced save
    this.saveSubject.next();
  }

  /**
   * Parse and apply language filter from comma-separated input
   */
  applyLanguageFilter(): void {
    const input = this.languageInput().trim();
    if (input) {
      const languages = input.split(',').map(lang => lang.trim()).filter(lang => lang.length > 0);
      this.updateFilter('languages', languages);
      this.logger.log(`Languages filter applied: ${languages.join(', ')}`);
    } else {
      this.updateFilter('languages', []);
    }
  }

  /**
   * Parse and apply skills filter from comma-separated input
   */
  applySkillsFilter(): void {
    const input = this.skillsInput().trim();
    if (input) {
      const skills = input.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
      this.updateFilter('skills', skills);
      this.logger.log(`Skills filter applied: ${skills.join(', ')}`);
    } else {
      this.updateFilter('skills', []);
    }
  }

  /**
   * Apply all filters (triggered by Apply Filters button)
   */
  applyFilters(): void {
    this.applyLanguageFilter();
    this.applySkillsFilter();
    this.logger.log('Filters applied:', this.filters());
    this.logger.log('Active filters count:', this.getActiveFilterCount());
    // Immediate save (no debounce) when user explicitly applies filters
    this.persistFilters();
  }

  /**
   * Clear all filters and reset to defaults
   */
  clearFilters(): void {
    this.filters.set({
      characterTypes: [],
      minAge: 0,
      maxAge: 100,
      gender: 'any',
      minHeight: 140,
      maxHeight: 200,
      minWeight: 40,
      maxWeight: 120,
      languages: [],
      skills: [],
      location: ''
    });
    this.languageInput.set('');
    this.skillsInput.set('');
    this.characterTypeSearch.set('');
    this.logger.log('All filters cleared');
  }

  /**
   * Get count of active non-default filters
   */
  getActiveFilterCount(): number {
    const currentFilters = this.filters();
    let count = 0;
    
    if (currentFilters.characterTypes.length > 0) count++;
    if (currentFilters.gender !== 'any') count++;
    if (currentFilters.minAge !== 0 || currentFilters.maxAge !== 100) count++;
    if (currentFilters.minHeight !== 140 || currentFilters.maxHeight !== 200) count++;
    if (currentFilters.minWeight !== 40 || currentFilters.maxWeight !== 120) count++;
    if (currentFilters.languages.length > 0) count++;
    if (currentFilters.skills.length > 0) count++;
    if (currentFilters.location) count++;
    
    return count;
  }

  /**
   * Toggle voice intro playback
   */
  toggleVoicePlay(actorUid: string): void {
    const actor = this.allActors().find(a => a.uid === actorUid);
    if (!actor?.voiceIntroUrl) return;

    // If currently playing this actor's voice, pause it
    if (this.playingVoiceId() === actorUid) {
      this.audioElement?.pause();
      this.playingVoiceId.set(null);
      return;
    }

    // Stop any currently playing audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    // Create and play new audio
    this.audioElement = new Audio(actor.voiceIntroUrl);
    this.playingVoiceId.set(actorUid);

    this.audioElement.addEventListener('ended', () => {
      this.playingVoiceId.set(null);
      this.audioElement = null;
    });

    this.audioElement.addEventListener('error', (error) => {
      this.logger.error('Error playing voice intro:', error);
      this.playingVoiceId.set(null);
      this.audioElement = null;
    });

    this.audioElement.play().catch(error => {
      this.logger.error('Failed to play audio:', error);
      this.playingVoiceId.set(null);
      this.audioElement = null;
    });
  }

  /**
   * Setup real-time wishlist listener for current producer
   */
  setupWishlistListener(): void {
    if (!this.currentUserId) {
      this.logger.warn('No user logged in, cannot setup wishlist listener');
      this.wishlistLoading.set(false);
      return;
    }

    const wishlistRef = doc(this.firestore, 'wishlists', this.currentUserId);
    
    // Setup real-time listener
    this.wishlistUnsubscribe = onSnapshot(
      wishlistRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const actorUids = data['actorUids'] || [];
          
          // Filter allActors to get full actor data for wishlisted UIDs
          const wishlistedActors = this.allActors().filter(actor => 
            actorUids.includes(actor.uid)
          );
          
          this.wishlist.set(wishlistedActors);
          this.logger.log(`Wishlist updated: ${wishlistedActors.length} actors`);
        } else {
          // No wishlist document exists yet
          this.wishlist.set([]);
          this.logger.log('No wishlist found, starting fresh');
        }
        
        // Stop loading after first data received
        this.wishlistLoading.set(false);
      },
      (error) => {
        this.logger.error('Error in wishlist listener:', error);
        this.wishlistLoading.set(false);
      }
    );
    
    this.logger.log('Wishlist real-time listener activated');
  }

  /**
   * Save wishlist to Firestore
   */
  async saveWishlist(): Promise<void> {
    if (!this.currentUserId) {
      this.logger.warn('No user logged in, cannot save wishlist');
      return;
    }

    try {
      const wishlistRef = doc(this.firestore, 'wishlists', this.currentUserId);
      const actorUids = this.wishlist().map(actor => actor.uid);
      
      await setDoc(wishlistRef, {
        producerId: this.currentUserId,
        actorUids: actorUids,
        updatedAt: new Date()
      }, { merge: true });
      
      this.logger.log('Wishlist saved to Firestore');
    } catch (err) {
      this.logger.error('Error saving wishlist:', err);
    }
  }

  /**
   * Toggle actor in wishlist and persist to Firestore
   */
  async toggleWishlist(actor: ActorSearchResult): Promise<void> {
    const currentWishlist = this.wishlist();
    const index = currentWishlist.findIndex(a => a.uid === actor.uid);

    if (index > -1) {
      // Remove from wishlist
      this.wishlist.set(currentWishlist.filter(a => a.uid !== actor.uid));
      this.logger.log(`Removed ${actor.stageName} from wishlist`);
    } else {
      // Add to wishlist
      this.wishlist.set([...currentWishlist, actor]);
      this.logger.log(`Added ${actor.stageName} to wishlist`);

      // Track analytics for wishlist addition
      if (this.currentUserId) {
        await this.analyticsService.trackWishlistAdd(actor.uid, this.currentUserId);
      }
    }

    // Persist to Firestore
    await this.saveWishlist();
  }

  isInWishlist(actor: ActorSearchResult): boolean {
    return this.wishlist().some(a => a.uid === actor.uid);
  }

  /**
   * Navigate to actor profile using stored slug-uid
   */
  viewProfile(actor: ActorSearchResult): void {
    console.log('=== viewProfile called ===');
    console.log('Actor:', actor);
    
    // Use stored slug-uid if available, otherwise generate temporary one
    const slugUid = actor.slug || this.profileUrlService.generateSlugUid(actor.stageName, actor.uid);
    console.log('Using slugUid:', slugUid);
    
    if (!actor.slug) {
      console.warn('Actor missing stored slug-uid, using generated one. This may not work if profile has a different slug-uid stored.');
    }
    
    // Navigate to profile
    this.router.navigate(['/discover', slugUid]).then(
      success => {
        console.log('Navigation success:', success);
        console.log('New URL:', this.router.url);
      },
      error => console.error('Navigation error:', error)
    );
  }

  viewAllWishlist(): void {
    // Could navigate to a dedicated wishlist page or export
    this.logger.log('View all wishlist:', this.wishlist());
  }
}