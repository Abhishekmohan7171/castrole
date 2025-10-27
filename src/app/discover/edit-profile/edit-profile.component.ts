import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Profile } from '../../../assets/interfaces/profile.interfaces';
import { EditSection, NavigationItem } from '../../../assets/interfaces/edit-profile.interfaces';
import { BasicInfoSectionComponent } from './sections/basic-info-section.component';
import { EducationSectionComponent } from './sections/education-section.component';
import { VoiceIntroSectionComponent } from './sections/voice-intro-section.component';
import { LanguagesSkillsSectionComponent } from './sections/languages-skills-section.component';
import { SocialsSectionComponent } from './sections/socials-section.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    BasicInfoSectionComponent,
    EducationSectionComponent,
    VoiceIntroSectionComponent,
    LanguagesSkillsSectionComponent,
    SocialsSectionComponent
  ],
  template: `
    <div class="min-h-screen bg-neutral-950">
      <!-- Mobile Header -->
      <div class="lg:hidden sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800">
        <div class="flex items-center justify-between px-4 py-3">
          <button
            (click)="toggleMobileSidebar()"
            class="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-white">Edit Profile</h1>
          <button
            (click)="navigateBack()"
            class="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex">
        <!-- Sidebar Navigation -->
        <aside
          [class]="sidebarClasses()"
          (click)="onSidebarBackdropClick($event)"
        >
          <div
            class="bg-neutral-900 h-full overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <!-- Desktop Header -->
            <div class="hidden lg:block px-6 py-6 border-b border-neutral-800">
              <h1 class="text-xl font-semibold text-white">edit profile</h1>
            </div>

            <!-- Navigation Items -->
            <nav class="space-y-1">
              @for (item of navigationItems(); track item.id) {
                <button
                  (click)="navigateToSection(item.id)"
                  [class]="activeSection() === item.id 
                    ? 'w-full text-left px-4 py-3 rounded-lg bg-purple-600/20 border-l-2 border-purple-500 transition-all duration-200'
                    : 'w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 border-l-2 border-transparent transition-all duration-200'"
                >
                  <div class="flex items-start gap-3">
                    <!-- Icon -->
                    <div [class]="activeSection() === item.id ? 'text-purple-400 mt-0.5' : 'text-neutral-500 mt-0.5'">
                      @switch (item.id) {
                        @case ('basic-info') {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        }
                        @case ('education') {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        }
                        @case ('voice-intro') {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        }
                        @case ('languages-skills') {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        @case ('socials') {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        }
                      }
                    </div>
                    
                    <!-- Text -->
                    <div class="flex-1 space-y-0.5">
                      <h3 
                        [class]="activeSection() === item.id 
                          ? 'text-base font-medium text-white'
                          : 'text-base font-medium text-neutral-300'"
                      >
                        {{ item.label }}
                      </h3>
                      <p class="text-xs text-neutral-500 leading-tight">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>
                </button>
              }
            </nav>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-h-screen">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <!-- Loading State -->
            @if (isLoading()) {
              <div class="flex items-center justify-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            } @else if (error()) {
              <!-- Error State -->
              <div class="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
                <svg class="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-red-300">{{ error() }}</p>
                <button
                  (click)="loadProfile()"
                  class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            } @else if (profile()) {
              <!-- Content Sections -->
              <div class="space-y-6">
                @switch (activeSection()) {
                  @case ('basic-info') {
                    <div>
                      <h2 class="text-2xl font-semibold text-white mb-6">Basic Information</h2>
                      <app-basic-info-section
                        [profile]="profile()"
                        [isActor]="isActor()"
                        (save)="onSectionSave($event, 'basic-info')"
                      />
                    </div>
                  }
                  @case ('education') {
                    <div>
                      <h2 class="text-2xl font-semibold text-white mb-6">{{ isActor() ? 'Education & Experience' : 'Works' }}</h2>
                      <app-education-section
                        [profile]="profile()"
                        [isActor]="isActor()"
                        (save)="onSectionSave($event, 'education')"
                      />
                    </div>
                  }
                  @case ('voice-intro') {
                    @if (isActor()) {
                      <div>
                        <h2 class="text-2xl font-semibold text-white mb-6">Voice Introduction</h2>
                        <app-voice-intro-section
                          [profile]="profile()"
                          (save)="onSectionSave($event, 'voice-intro')"
                        />
                      </div>
                    }
                  }
                  @case ('languages-skills') {
                    @if (isActor()) {
                      <div>
                        <h2 class="text-2xl font-semibold text-white mb-6">Languages & Skills</h2>
                        <app-languages-skills-section
                          [profile]="profile()"
                          (save)="onSectionSave($event, 'languages-skills')"
                        />
                      </div>
                    }
                  }
                  @case ('socials') {
                    <div>
                      <h2 class="text-2xl font-semibold text-white mb-6">Social Links</h2>
                      <app-socials-section
                        [profile]="profile()"
                        (save)="onSectionSave($event, 'socials')"
                      />
                    </div>
                  }
                }
              </div>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class EditProfileComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // State
  profile = signal<Profile | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  activeSection = signal<EditSection>('basic-info');
  isMobileSidebarOpen = signal(false);

  // All navigation items
  private allNavigationItems: NavigationItem[] = [
    {
      id: 'basic-info',
      label: 'basic info',
      description: 'profile image, name, age, gender, height, weight, location',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
      descriptionProducer: 'profile image, name, location, designation, production house'
    },
    {
      id: 'education',
      label: 'education & experience',
      description: 'education, previous experiences',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`,
      labelProducer: 'works',
      descriptionProducer: 'previous projects and works'
    },
    {
      id: 'voice-intro',
      label: 'voice intro',
      description: 'voice intro',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>`
    },
    {
      id: 'languages-skills',
      label: 'languages & skills',
      description: 'languages and extracurriculars',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>`
    },
    {
      id: 'socials',
      label: 'socials',
      description: 'links, social media',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`
    }
  ];

  // Computed navigation items based on role
  navigationItems = computed(() => {
    const items = this.isActor() 
      ? this.allNavigationItems
      : this.allNavigationItems.filter(item => 
          item.id !== 'voice-intro' && item.id !== 'languages-skills'
        );
    
    // Update labels and descriptions for producer-specific items
    if (!this.isActor()) {
      return items.map(item => {
        if (item.labelProducer || item.descriptionProducer) {
          return {
            ...item,
            label: item.labelProducer || item.label,
            description: item.descriptionProducer || item.description
          };
        }
        return item;
      });
    }
    
    return items;
  });

  // Computed
  isActor = computed(() => {
    return !!this.profile()?.actorProfile;
  });

  sidebarClasses = computed(() => {
    const base = 'fixed lg:sticky top-0 lg:top-0 left-0 h-screen z-50 transition-transform duration-300';
    const width = 'w-72 lg:w-64';
    const mobile = this.isMobileSidebarOpen() 
      ? 'translate-x-0' 
      : '-translate-x-full lg:translate-x-0';
    const backdrop = this.isMobileSidebarOpen() 
      ? 'lg:bg-transparent bg-black/60 backdrop-blur-sm' 
      : '';
    
    return `${base} ${width} ${mobile} ${backdrop}`;
  });

  ngOnInit() {
    this.loadProfile();
    
    // Listen to query params for section navigation
    this.route.queryParams.subscribe(params => {
      const section = params['section'] as EditSection;
      if (section && this.isValidSection(section)) {
        this.activeSection.set(section);
      }
    });
  }

  async loadProfile() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const profileRef = doc(this.firestore, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        throw new Error('Profile not found');
      }

      this.profile.set(profileSnap.data() as Profile);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToSection(section: EditSection) {
    this.activeSection.set(section);
    this.isMobileSidebarOpen.set(false);
    
    // Update URL without reloading
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section },
      queryParamsHandling: 'merge'
    });
  }

  getNavItemClasses(section: EditSection): string {
    const isActive = this.activeSection() === section;
    const base = 'w-full px-4 py-3 rounded-lg transition-all duration-200 text-left';
    const active = isActive
      ? 'bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/50'
      : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200';
    
    return `${base} ${active}`;
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update(v => !v);
  }

  onSidebarBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.isMobileSidebarOpen.set(false);
    }
  }

  navigateBack() {
    this.router.navigate(['/profile']);
  }

  private isValidSection(section: string): section is EditSection {
    const allSections = ['basic-info', 'education', 'voice-intro', 'languages-skills', 'socials'];
    if (!allSections.includes(section)) {
      return false;
    }
    
    // Additional role-based validation
    if (!this.isActor() && (section === 'voice-intro' || section === 'languages-skills')) {
      return false;
    }
    
    return true;
  }

  async onSectionSave(data: any, section: EditSection) {
    if (!this.profile()) return;

    try {
      const currentProfile = this.profile()!;
      const updatedProfile: any = { ...currentProfile };

      // Update based on section
      switch (section) {
        case 'basic-info':
          // Update common fields
          updatedProfile.location = data.location;

          // Update role-specific fields
          if (this.isActor()) {
            updatedProfile.age = data.age;
            updatedProfile.gender = data.gender;
            updatedProfile.actorProfile = {
              ...currentProfile.actorProfile,
              stageName: data.stageName,
              height: data.height,
              weight: data.weight,
              actorProfileImageUrl: data.profileImageUrl || currentProfile.actorProfile?.actorProfileImageUrl
            };
          } else {
            updatedProfile.producerProfile = {
              ...currentProfile.producerProfile,
              name: data.name,
              designation: data.designation,
              productionHouse: data.productionHouse,
              industryType: data.industryType,
              producerProfileImageUrl: data.profileImageUrl || currentProfile.producerProfile?.producerProfileImageUrl
            };
          }
          break;

        case 'education':
          if (this.isActor()) {
            updatedProfile.actorProfile = {
              ...currentProfile.actorProfile,
              listEducation: data.education
            };
          } else {
            updatedProfile.producerProfile = {
              ...currentProfile.producerProfile,
              producerWorks: data.works
            };
          }
          break;

        case 'voice-intro':
          if (this.isActor()) {
            updatedProfile.actorProfile = {
              ...currentProfile.actorProfile,
              voiceIntro: data.voiceIntro
            };
          }
          break;

        case 'languages-skills':
          if (this.isActor()) {
            updatedProfile.actorProfile = {
              ...currentProfile.actorProfile,
              languages: data.languages,
              skills: data.skills
            };
          }
          break;

        case 'socials':
          updatedProfile.social = data.social;
          break;
      }

      // Save to Firestore
      const profileRef = doc(this.firestore, 'profiles', currentProfile.uid);
      const cleanedProfile = this.removeUndefinedFields(updatedProfile);
      await updateDoc(profileRef, cleanedProfile);

      // Update local state
      this.profile.set(updatedProfile as Profile);

      // Show success feedback (you can add a toast service later)
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  }

  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value !== undefined) {
            cleaned[key] = this.removeUndefinedFields(value);
          }
        }
      }
      return cleaned;
    }

    return obj;
  }
}
