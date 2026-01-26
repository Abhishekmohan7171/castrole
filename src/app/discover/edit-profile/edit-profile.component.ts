import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Profile } from '../../../assets/interfaces/profile.interfaces';
import {
  EditSection,
  NavigationItem,
} from '../../../assets/interfaces/edit-profile.interfaces';
import { BasicInfoSectionComponent } from './sections/basic-info-section.component';
import { EducationSectionComponent } from './sections/education-section.component';
import { VoiceIntroSectionComponent } from './sections/voice-intro-section.component';
import { LanguagesSkillsSectionComponent } from './sections/languages-skills-section.component';
import { SocialsSectionComponent } from './sections/socials-section.component';
import { ToastService } from '../../services/toast.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    BasicInfoSectionComponent,
    EducationSectionComponent,
    VoiceIntroSectionComponent,
    LanguagesSkillsSectionComponent,
    SocialsSectionComponent,
  ],
  template: `
    <div class="min-h-screen bg-transparent">
      <!-- Mobile Header -->
      <div
        class="lg:hidden sticky top-0 z-40 backdrop-blur-sm border-b"
        [ngClass]="{
          'bg-[#2D1C36]/95 border-[#946BA9]/20': isActor(),
          'bg-[#101214]/95 border-neutral-800': !isActor()
        }"
      >
        <div class="flex items-center justify-between px-4 py-3">
          <button
            (click)="toggleMobileSidebar()"
            class="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              class="w-6 h-6 text-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-white">Edit Profile</h1>
          <button
            (click)="navigateBack()"
            class="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg
              class="w-5 h-5 text-neutral-400"
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
        </div>
      </div>

      <div class="flex">
        <!-- Sidebar Navigation -->
        <aside
          [class]="sidebarClasses()"
          (click)="onSidebarBackdropClick($event)"
        >
          <div
            class="h-full overflow-y-auto bg-transparent"
            (click)="$event.stopPropagation()"
          >
            <!-- Desktop Header -->
            <div
              class="hidden lg:block px-6 py-6"
            >
              <h1 class="text-lg font-semibold text-white">edit profile</h1>
            </div>

            <!-- Navigation Items -->
            <nav class="space-y-2 px-4">
              @for (item of navigationItems(); track item.id) {
                <button
                  (click)="navigateToSection(item.id)"
                  class="w-full text-left px-4 py-4 rounded-xl border-l-2 transition-all duration-200"
                  [ngClass]="{
                    'bg-[#2D1C36] text-white border-[#946BA9]': activeSection() === item.id && isActor(),
                    'bg-[#515D69]/30 text-white border-[#90ACC8]': activeSection() === item.id && !isActor(),
                    'text-[#5E5E67] hover:bg-white/5 border-transparent': activeSection() !== item.id
                  }"
                >
                <div class="flex items-start gap-3">
                  <!-- Icon -->
                  <div
                    class="mt-0.5"
                    [ngClass]="{
                      'text-white': activeSection() === item.id,
                      'text-[#5E5E67]': activeSection() !== item.id
                    }"
                  >
                    @switch (item.id) { @case ('basic-info') {
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    } @case ('education') {
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    } @case ('voice-intro') {
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    } @case ('languages-skills') {
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    } @case ('socials') {
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    } }
                  </div>

                  <!-- Text -->
                  <div class="flex-1 space-y-0.5">
                    <h3
                      class="text-base font-medium"
                      [ngClass]="{
                        'text-white': activeSection() === item.id,
                        'text-[#5E5E67]': activeSection() !== item.id
                      }"
                    >
                      {{ item.label }}
                    </h3>
                    <p class="text-xs text-[#5E5E67] leading-tight">
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
              <div
                class="animate-spin rounded-full h-12 w-12 border-b-2"
                [ngClass]="{
                  'border-[#946BA9]': isActor(),
                  'border-[#90ACC8]': !isActor()
                }"
              ></div>
            </div>
            } @else if (error()) {
            <!-- Error State -->
            <div
              class="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center"
            >
              <svg
                class="w-12 h-12 text-red-500 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
              @switch (activeSection()) { @case ('basic-info') {
              <div>
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-2xl font-semibold text-white">
                    Basic Information
                  </h2>
                  <span
                    class="text-xs font-medium"
                    [ngClass]="{
                      'text-neutral-500':
                        getSectionStatus('basic-info') === 'idle',
                      'text-blue-400':
                        getSectionStatus('basic-info') === 'saving',
                      'text-green-400':
                        getSectionStatus('basic-info') === 'saved',
                      'text-red-400': getSectionStatus('basic-info') === 'error'
                    }"
                  >
                    @switch (getSectionStatus('basic-info')) { @case ('saving')
                    { saving... } @case ('saved') { saved } @case ('error') {
                    save failed } }
                  </span>
                </div>
                <app-basic-info-section
                  [profile]="profile()"
                  [isActor]="isActor()"
                  (save)="onSectionSave($event, 'basic-info')"
                />
              </div>
              } @case ('education') {
              <div>
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-2xl font-semibold text-white">
                    {{ isActor() ? 'Education & Experience' : 'Education & Credits' }}
                  </h2>
                  <span
                    class="text-xs font-medium"
                    [ngClass]="{
                      'text-neutral-500':
                        getSectionStatus('education') === 'idle',
                      'text-blue-400':
                        getSectionStatus('education') === 'saving',
                      'text-green-400':
                        getSectionStatus('education') === 'saved',
                      'text-red-400': getSectionStatus('education') === 'error'
                    }"
                  >
                    @switch (getSectionStatus('education')) { @case ('saving') {
                    saving... } @case ('saved') { saved } @case ('error') { save
                    failed } }
                  </span>
                </div>
                <app-education-section
                  [profile]="profile()"
                  [isActor]="isActor()"
                  (save)="onSectionSave($event, 'education')"
                />
              </div>
              } @case ('voice-intro') { @if (isActor()) {
              <div>
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-2xl font-semibold text-white">
                    Voice Introduction
                  </h2>
                  <span
                    class="text-xs font-medium"
                    [ngClass]="{
                      'text-neutral-500':
                        getSectionStatus('voice-intro') === 'idle',
                      'text-blue-400':
                        getSectionStatus('voice-intro') === 'saving',
                      'text-green-400':
                        getSectionStatus('voice-intro') === 'saved',
                      'text-red-400':
                        getSectionStatus('voice-intro') === 'error'
                    }"
                  >
                    @switch (getSectionStatus('voice-intro')) { @case ('saving')
                    { saving... } @case ('saved') { saved } @case ('error') {
                    save failed } }
                  </span>
                </div>
                <app-voice-intro-section
                  [profile]="profile()"
                  (save)="onSectionSave($event, 'voice-intro')"
                />
              </div>
              } } @case ('languages-skills') { @if (isActor()) {
              <div>
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-2xl font-semibold text-white">
                    Languages & Skills
                  </h2>
                  <span
                    class="text-xs font-medium"
                    [ngClass]="{
                      'text-neutral-500':
                        getSectionStatus('languages-skills') === 'idle',
                      'text-blue-400':
                        getSectionStatus('languages-skills') === 'saving',
                      'text-green-400':
                        getSectionStatus('languages-skills') === 'saved',
                      'text-red-400':
                        getSectionStatus('languages-skills') === 'error'
                    }"
                  >
                    @switch (getSectionStatus('languages-skills')) { @case
                    ('saving') { saving... } @case ('saved') { saved } @case
                    ('error') { save failed } }
                  </span>
                </div>
                <app-languages-skills-section
                  [profile]="profile()"
                  (save)="onSectionSave($event, 'languages-skills')"
                />
              </div>
              } } @case ('socials') {
              <div>
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-2xl font-semibold text-white">
                    Social Links
                  </h2>
                  <span
                    class="text-xs font-medium"
                    [ngClass]="{
                      'text-neutral-500':
                        getSectionStatus('socials') === 'idle',
                      'text-blue-400': getSectionStatus('socials') === 'saving',
                      'text-green-400': getSectionStatus('socials') === 'saved',
                      'text-red-400': getSectionStatus('socials') === 'error'
                    }"
                  >
                    @switch (getSectionStatus('socials')) { @case ('saving') {
                    saving... } @case ('saved') { saved } @case ('error') { save
                    failed } }
                  </span>
                </div>
                <app-socials-section
                  [profile]="profile()"
                  (save)="onSectionSave($event, 'socials')"
                />
              </div>
              } }
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
  `,
})
export class EditProfileComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);

  // State
  profile = signal<Profile | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  activeSection = signal<EditSection>('basic-info');
  isMobileSidebarOpen = signal(false);
  
  // User role signal - matches settings component approach
  userRole = signal<string>('producer'); // Default to producer to prevent purple flash

  private sectionStatus = signal<
    Record<EditSection, 'idle' | 'saving' | 'saved' | 'error'>
  >({
    'basic-info': 'idle',
    education: 'idle',
    'voice-intro': 'idle',
    'languages-skills': 'idle',
    socials: 'idle',
  });

  // All navigation items
  private allNavigationItems: NavigationItem[] = [
    {
      id: 'basic-info',
      label: 'basic info',
      description: 'profile image, name, age, gender, height, weight, location',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
      descriptionProducer: 'profile image, name, location, designation, production house, industry type',
    },
    {
      id: 'education',
      label: 'education & experience',
      description: 'education, previous experiences',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`,
      labelProducer: 'education & credits',
      descriptionProducer: 'education, previous projects and credits',
    },
    {
      id: 'voice-intro',
      label: 'voice intro',
      description: 'voice intro',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>`,
    },
    {
      id: 'languages-skills',
      label: 'languages & skills',
      description: 'languages and extracurriculars',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>`,
    },
    {
      id: 'socials',
      label: 'socials',
      description: 'links, social media',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`,
    },
  ];

  // Computed navigation items based on role
  navigationItems = computed(() => {
    const items = this.isActor()
      ? this.allNavigationItems
      : this.allNavigationItems.filter(
          (item) =>
            item.id !== 'voice-intro' &&
            item.id !== 'languages-skills'
        );

    // Update labels and descriptions for producer-specific items
    if (!this.isActor()) {
      return items.map((item) => {
        if (item.labelProducer || item.descriptionProducer) {
          return {
            ...item,
            label: item.labelProducer || item.label,
            description: item.descriptionProducer || item.description,
          };
        }
        return item;
      });
    }

    return items;
  });

  // Computed - use userRole signal instead of profile to avoid flashing
  isActor = computed(() => {
    return this.userRole() === 'actor';
  });

  sidebarClasses = computed(() => {
    const base =
      'fixed lg:sticky top-0 lg:top-0 left-0 h-screen z-50 transition-transform duration-300';
    const width = 'w-72 lg:w-64';
    const mobile = this.isMobileSidebarOpen()
      ? 'translate-x-0'
      : '-translate-x-full lg:translate-x-0';
    const backdrop = this.isMobileSidebarOpen()
      ? 'lg:bg-transparent bg-black/60 backdrop-blur-sm'
      : '';

    return `${base} ${width} ${mobile} ${backdrop}`;
  });

  async ngOnInit() {
    // Load user role first from Firestore users collection
    try {
      const user = this.auth.currentUser;
      if (user) {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          this.userRole.set(userData['currentRole'] || 'producer');
        } else {
          // Fallback if user doc doesn't exist
          this.userRole.set('producer');
        }
      }
    } catch (err) {
      console.error('Error loading user role:', err);
      // Fallback on error
      this.userRole.set('producer');
    }
    
    this.loadProfile();

    // Listen to query params for section navigation
    this.route.queryParams.subscribe((params) => {
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

      const profileData = profileSnap.data() as Profile;
      this.profile.set(profileData);
      
      // Note: userRole is already set from users.currentRole in ngOnInit
      // Don't override it here based on actorProfile existence
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
      queryParamsHandling: 'merge',
    });
  }

  // Removed unused getNavItemClasses method - colors are now role-based in template

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update((v) => !v);
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
    const allSections = [
      'basic-info',
      'education',
      'voice-intro',
      'languages-skills',
      'socials',
    ];
    if (!allSections.includes(section)) {
      return false;
    }

    // Additional role-based validation
    if (
      !this.isActor() &&
      (section === 'voice-intro' ||
        section === 'languages-skills')
    ) {
      return false;
    }

    return true;
  }

  async onSectionSave(data: any, section: EditSection) {
    if (!this.profile()) return;

    const payload = data || {};
    const isAutosave = !!payload.autosave;
    const cleanPayload = { ...payload };
    delete (cleanPayload as any).autosave;

    await this.saveSectionWithRetry(cleanPayload, section, 3, isAutosave);
  }

  private async saveSectionWithRetry(
    data: any,
    section: EditSection,
    attemptsLeft: number,
    isAutosave: boolean
  ): Promise<void> {
    this.updateSectionStatus(section, 'saving');

    try {
      await this.saveSectionOnce(data, section);
      this.updateSectionStatus(section, 'saved');

      if (!isAutosave) {
        this.toastService.success('Profile updated successfully!');
      }

      // Check profile completeness and trigger notification after successful save
      await this.checkAndNotifyProfileCompleteness();
    } catch (error) {
      if (attemptsLeft > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.saveSectionWithRetry(
          data,
          section,
          attemptsLeft - 1,
          isAutosave
        );
      }

      this.updateSectionStatus(section, 'error');
      this.toastService.error('Failed to save profile. Please try again.');
    }
  }

  private async saveSectionOnce(
    data: any,
    section: EditSection
  ): Promise<void> {
    const currentProfile = this.profile()!;
    const updatedProfile: any = { ...currentProfile };

    switch (section) {
      case 'basic-info':
        updatedProfile.location = data.location;

        if (this.isActor()) {
          updatedProfile.age = data.age;
          updatedProfile.gender = data.gender;
          updatedProfile.actorProfile = {
            ...currentProfile.actorProfile,
            stageName: data.stageName,
            height: data.height,
            bodyType: data.bodyType,
            actorProfileImageUrl:
              data.profileImageUrl ||
              currentProfile.actorProfile?.actorProfileImageUrl,
          };
        } else {
          updatedProfile.producerProfile = {
            ...currentProfile.producerProfile,
            name: data.name,
            designation: data.designation,
            productionHouse: data.productionHouse,
            industryType: data.industryType,
            producerProfileImageUrl:
              data.profileImageUrl ||
              currentProfile.producerProfile?.producerProfileImageUrl,
          };
        }
        break;

      case 'education':
        if (this.isActor()) {
          updatedProfile.actorProfile = {
            ...currentProfile.actorProfile,
            listEducation: data.education,
            actorWorks: data.actorWorks,
          };
        } else {
          updatedProfile.producerProfile = {
            ...currentProfile.producerProfile,
            listEducation: data.education,
            producerWorks: data.works,
          };
        }
        break;

      case 'voice-intro':
        if (this.isActor()) {
          updatedProfile.actorProfile = {
            ...currentProfile.actorProfile,
            voiceIntro: data.voiceIntro,
          };
        }
        break;

      case 'languages-skills':
        if (this.isActor()) {
          updatedProfile.actorProfile = {
            ...currentProfile.actorProfile,
            languages: data.languages,
            skills: data.skills,
          };
        }
        break;

      case 'socials':
        updatedProfile.social = data.social;
        break;
    }

    const profileRef = doc(this.firestore, 'profiles', currentProfile.uid);
    const cleanedProfile = this.removeUndefinedFields(updatedProfile);
    await updateDoc(profileRef, cleanedProfile);

    this.profile.set(updatedProfile as Profile);
  }

  private updateSectionStatus(
    section: EditSection,
    status: 'idle' | 'saving' | 'saved' | 'error'
  ) {
    const current = this.sectionStatus();
    this.sectionStatus.set({ ...current, [section]: status });
  }

  getSectionStatus(
    section: EditSection
  ): 'idle' | 'saving' | 'saved' | 'error' {
    const status = this.sectionStatus()[section];
    return status ?? 'idle';
  }

  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeUndefinedFields(item));
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

  /**
   * Check profile completeness and trigger notification immediately
   * Called after every successful save (including autosave)
   */
  private async checkAndNotifyProfileCompleteness(): Promise<void> {
    try {
      const currentProfile = this.profile();
      const userId = this.auth.currentUser?.uid;
      
      // Only check for actors
      if (!currentProfile || !userId || !this.isActor()) {
        return;
      }

      const actorProfile = currentProfile.actorProfile;
      if (!actorProfile) return;

      // Calculate completeness (same 10 fields as NotificationService)
      let completedFields = 0;
      const totalFields = 10;

      if (actorProfile.stageName) completedFields++;
      if ((currentProfile as any).bio) completedFields++; // bio is stored at Profile level
      if (actorProfile.actorProfileImageUrl) completedFields++;
      if (currentProfile.age) completedFields++; // age is at Profile level
      if (currentProfile.gender) completedFields++; // gender is at Profile level
      if (actorProfile.height) completedFields++;
      if (actorProfile.bodyType) completedFields++;
      if (currentProfile.location) completedFields++; // location is at Profile level
      if (actorProfile.skills && actorProfile.skills.length > 0) completedFields++;
      if (actorProfile.languages && actorProfile.languages.length > 0) completedFields++;

      const percentage = Math.round((completedFields / totalFields) * 100);

      // Trigger notification if less than 90% complete
      if (percentage < 90) {
        await this.notificationService.createProfileCompletenessReminder(userId, percentage);
      }
    } catch (error) {
      // Silently fail - don't break the save flow
      console.error('Error checking profile completeness:', error);
    }
  }
}
