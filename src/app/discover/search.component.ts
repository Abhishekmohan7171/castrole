import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, query, where, getDocs, DocumentData, doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Profile, ActorProfile } from '../../assets/interfaces/profile.interfaces';
import { UserDoc } from '../../assets/interfaces/interfaces';
import { LoggerService } from '../services/logger.service';

interface ActorSearchResult {
  uid: string;
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
  profileViewCount?: number;
  wishlistCount?: number;
  // For search relevance
  relevanceScore?: number;
}

interface SearchFilters {
  characterTypes: string[];  // Changed to array for multi-select
  minAge: number;
  maxAge: number;
  gender: string;
  heightCm: string;  // Changed from heightFt/heightIn to single cm value
  weightKg: string;  // Renamed for clarity
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
    <div class="min-h-screen bg-black text-neutral-200">
      <!-- Search Bar -->
      <div class="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Describe your character — e.g. 25-year-old fair boy with boxing skills"
              class="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-6 py-4 pr-24 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-fuchsia-500 transition-colors">
            
            <!-- Voice and AI icons -->
            <div class="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
              <button class="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-fuchsia-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button class="p-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-600 transition-colors text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
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

              <!-- Character Type (Multi-Select) -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Character Type</label>
                <div class="space-y-2">
                  @for (type of ['Lead', 'Supporting', 'Extra', 'Cameo']; track type) {
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        [checked]="filters().characterTypes.includes(type.toLowerCase())"
                        (change)="toggleCharacterType(type.toLowerCase())"
                        class="w-4 h-4 rounded border-neutral-600 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-neutral-900">
                      <span class="text-neutral-300">{{ type }}</span>
                    </label>
                  }
                </div>
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
                      class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500">
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
                  <option value="any">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <!-- Height (cm) / Weight (kg) -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Height / Weight</label>
                <div class="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    [value]="filters().heightCm"
                    (input)="updateFilter('heightCm', $any($event.target).value)"
                    placeholder="Height (cm)"
                    min="0"
                    max="250"
                    class="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-center focus:outline-none focus:border-fuchsia-500">
                  <input 
                    type="number" 
                    [value]="filters().weightKg"
                    (input)="updateFilter('weightKg', $any($event.target).value)"
                    placeholder="Weight (kg)"
                    min="0"
                    max="200"
                    class="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-center focus:outline-none focus:border-fuchsia-500">
                </div>
              </div>

              <!-- Skills -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">Skills</label>
                <input 
                  type="text" 
                  [value]="skillsInput()"
                  (input)="skillsInput.set($any($event.target).value)"
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
                  (input)="languageInput.set($any($event.target).value)"
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
                  class="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-medium py-3 rounded-lg transition-colors">
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
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Types: {{ filters().characterTypes.join(', ') }}
                    <button (click)="updateFilter('characterTypes', [])" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
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
                
                @if (filters().heightCm) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Height: {{ filters().heightCm }}cm
                    <button (click)="updateFilter('heightCm', '')" class="hover:text-neutral-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                
                @if (filters().weightKg) {
                  <span class="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                    Weight: {{ filters().weightKg }}kg
                    <button (click)="updateFilter('weightKg', '')" class="hover:text-neutral-100">
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
                    <!-- Actor Photo -->
                    <div class="relative aspect-[3/4] bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
                      @if (actor.profileImageUrl) {
                        <img [src]="actor.profileImageUrl" [alt]="actor.stageName" class="w-full h-full object-cover">
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-6xl font-bold text-neutral-700">
                          {{ actor.stageName.charAt(0).toUpperCase() }}
                        </div>
                      }
                      
                      <!-- Hover Overlay -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <!-- Actor Info -->
                    <div class="p-4">
                      <h3 class="text-lg font-semibold text-neutral-100 mb-1">{{ actor.stageName }}</h3>
                      <p class="text-sm text-neutral-400 mb-3">{{ actor.age || 'N/A' }} years old</p>

                      <!-- Skills/Tags -->
                      @if (actor.skills && actor.skills.length > 0) {
                        <div class="flex flex-wrap gap-1.5 mb-4">
                          @for (skill of actor.skills.slice(0, 3); track skill) {
                            <span class="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300">
                              {{ skill }}
                            </span>
                          }
                        </div>
                      }

                      <!-- Actions -->
                      <div class="flex items-center gap-2">
                        <button 
                          (click)="viewProfile(actor)"
                          class="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          (click)="toggleWishlist(actor)"
                          [class]="isInWishlist(actor) ? 'bg-fuchsia-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-fuchsia-400'"
                          class="p-2 rounded-lg transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" [attr.fill]="isInWishlist(actor) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
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
  private destroy$ = new Subject<void>();
  private currentUserId: string | null = null;
  private wishlistUnsubscribe: Unsubscribe | null = null;

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
    characterTypes: [],  // Empty array means 'any'
    minAge: 0,  // Changed from 18 to 0
    maxAge: 100,  // Changed from 50 to 100
    gender: 'any',
    heightCm: '',  // Single height value in cm
    weightKg: '',  // Weight in kg
    languages: [],
    skills: [],
    location: ''
  });
  
  // Temporary inputs for comma-separated fields
  languageInput = signal('');
  skillsInput = signal('');

  // Wishlist
  wishlist = signal<ActorSearchResult[]>([]);
  wishlistLoading = signal(false);

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
      currentFilters.heightCm !== '' ||
      currentFilters.weightKg !== '' ||
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

    // Apply height filter if specified (in cm)
    if (currentFilters.heightCm) {
      const targetHeightCm = parseInt(currentFilters.heightCm);
      if (targetHeightCm > 0) {
        const beforeCount = actors.length;
        actors = actors.filter(actor => {
          const actorHeightCm = this.parseHeightToCm(actor.height || '');
          // Allow ±5 cm tolerance
          return Math.abs(actorHeightCm - targetHeightCm) <= 5;
        });
        this.logger.log(`Height filter (${currentFilters.heightCm}cm ±5): ${beforeCount} → ${actors.length} actors`);
      }
    }

    // Apply weight filter if specified (in kg)
    if (currentFilters.weightKg) {
      const targetWeight = parseInt(currentFilters.weightKg);
      if (targetWeight > 0) {
        const beforeCount = actors.length;
        actors = actors.filter(actor => {
          const actorWeight = parseInt(actor.weight || '0');
          // Allow ±5 kg tolerance
          return Math.abs(actorWeight - targetWeight) <= 5;
        });
        this.logger.log(`Weight filter (${currentFilters.weightKg}kg ±5): ${beforeCount} → ${actors.length} actors`);
      }
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
    
    // Load actors in background but don't display until search
    // Wishlist will be loaded after actors are loaded
    this.loadActors();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
    
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
      this.allActors.set(actors);
      
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
    
    const result = {
      uid: profile.uid,
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
   * Check if user has applied any non-default filters
   */
  hasActiveFilters(): boolean {
    const currentFilters = this.filters();
    return (
      currentFilters.characterTypes.length > 0 ||
      currentFilters.gender !== 'any' ||
      currentFilters.minAge !== 0 ||
      currentFilters.maxAge !== 100 ||
      currentFilters.heightCm !== '' ||
      currentFilters.weightKg !== '' ||
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
  }
  
  /**
   * Parse and apply language filter from comma-separated input
   */
  applyLanguageFilter(): void {
    const input = this.languageInput().trim();
    if (input) {
      // Split by comma and clean up
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
      // Split by comma and clean up
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
    // Parse comma-separated inputs
    this.applyLanguageFilter();
    this.applySkillsFilter();
    
    // Log current filter state
    this.logger.log('Filters applied:', this.filters());
    this.logger.log('Active filters count:', this.getActiveFilterCount());
    
    // Computed signal will automatically recalculate
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
      heightCm: '',
      weightKg: '',
      languages: [],
      skills: [],
      location: ''
    });
    this.languageInput.set('');
    this.skillsInput.set('');
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
    if (currentFilters.heightCm) count++;
    if (currentFilters.weightKg) count++;
    if (currentFilters.languages.length > 0) count++;
    if (currentFilters.skills.length > 0) count++;
    if (currentFilters.location) count++;
    
    return count;
  }

  /**
   * Setup real-time wishlist listener for current producer
   * Updates automatically when wishlist changes on any device
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
    }
    
    // Persist to Firestore
    await this.saveWishlist();
  }

  isInWishlist(actor: ActorSearchResult): boolean {
    return this.wishlist().some(a => a.uid === actor.uid);
  }

  viewProfile(actor: ActorSearchResult): void {
    // Navigate to actor profile or chat
    this.router.navigate(['/discover/chat'], { 
      queryParams: { userId: actor.uid }
    });
  }

  viewAllWishlist(): void {
    // Could navigate to a dedicated wishlist page or export
    this.logger.log('View all wishlist:', this.wishlist());
  }
}