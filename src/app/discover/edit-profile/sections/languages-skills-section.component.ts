import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Profile,
  Language,
  Skill,
} from '../../../../assets/interfaces/profile.interfaces';

@Component({
  selector: 'app-languages-skills-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <!-- Languages Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-3 text-neutral-300">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
          <h3 class="text-xl font-semibold">languages</h3>
        </div>

        <!-- Add Language Input -->
        @if (isAddingLanguage()) {
        <div
          class="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/50 space-y-4"
        >
          <div class="relative">
            <input
              type="text"
              [value]="newLanguageName()"
              (input)="onLanguageInput($event)"
              (focus)="showLanguageDropdown.set(true)"
              (blur)="onLanguageBlur()"
              (keydown.arrowdown)="onLanguageKeyDown($event, 'down')"
              (keydown.arrowup)="onLanguageKeyDown($event, 'up')"
              (keydown.enter)="onLanguageKeyDown($event, 'enter')"
              (keydown.escape)="showLanguageDropdown.set(false)"
              placeholder="Type to search languages..."
              class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autofocus
            />

            <!-- Autocomplete Dropdown -->
            @if (showLanguageDropdown() && filteredLanguages().length > 0) {
            <div class="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl">
              @for (lang of filteredLanguages(); track lang; let i = $index) {
              <button
                type="button"
                (mousedown)="selectLanguageFromDropdown(lang)"
                [class]="languageDropdownIndex() === i
                  ? 'w-full px-4 py-2.5 text-left hover:bg-neutral-700 transition-colors text-white bg-neutral-800'
                  : 'w-full px-4 py-2.5 text-left hover:bg-neutral-800 transition-colors text-white'"
              >
                {{ lang }}
              </button>
              }
            </div>
            }
          </div>

          <!-- Star Rating -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-neutral-400">Proficiency:</span>
            <div class="flex gap-1">
              @for (star of [1,2,3,4,5]; track star) {
              <button
                type="button"
                (click)="newLanguageProficiency.set(star)"
                class="transition-all duration-200 hover:scale-110"
              >
                <svg
                  class="w-6 h-6"
                  [class]="
                    star <= newLanguageProficiency()
                      ? 'text-purple-500 fill-purple-500'
                      : 'text-neutral-600'
                  "
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
              }
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              (click)="addLanguage()"
              [disabled]="!newLanguageName().trim()"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg transition-all"
            >
              Add
            </button>
            <button
              type="button"
              (click)="cancelAddLanguage()"
              class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
        }

        <!-- Languages List -->
        @if (languages().length > 0) {
        <div class="space-y-3">
          @for (lang of languages(); track lang.language) {
          <div
            class="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/50 flex items-center justify-between group hover:border-neutral-600 transition-all"
          >
            <div class="flex-1 flex items-center gap-4">
              <span class="text-white font-medium">{{ lang.language }}</span>

              <!-- Star Rating Display -->
              <div class="flex gap-1">
                @for (star of [1,2,3,4,5]; track star) {
                <button
                  type="button"
                  (click)="updateLanguageProficiency(lang, star)"
                  class="transition-all duration-200 hover:scale-110"
                >
                  <svg
                    class="w-5 h-5"
                    [class]="
                      star <= lang.rating
                        ? 'text-purple-500 fill-purple-500'
                        : 'text-neutral-600'
                    "
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
                }
              </div>
            </div>

            <!-- Remove Button -->
            <button
              type="button"
              (click)="removeLanguage(lang)"
              class="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          }
        </div>
        } @else {
        <div
          class="bg-neutral-800/20 rounded-xl p-6 border border-dashed border-neutral-700 text-center"
        >
          <p class="text-neutral-400 text-sm">
            no languages added yet, tap
            <button
              (click)="startAddLanguage()"
              class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-all mx-1"
            >
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            to add languages
          </p>
        </div>
        }

        <!-- Add Language Button -->
        @if (!isAddingLanguage() && languages().length > 0) {
        <button
          type="button"
          (click)="startAddLanguage()"
          class="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
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
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm font-medium">add language</span>
        </button>
        }
      </div>

      <!-- Skills Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-3 text-neutral-300">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <h3 class="text-xl font-semibold">skills</h3>
        </div>

        <!-- Add Skill Input -->
        @if (isAddingSkill()) {
        <div
          class="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/50 space-y-4"
        >
          <div class="relative">
            <input
              type="text"
              [value]="newSkillName()"
              (input)="onSkillInput($event)"
              (focus)="showSkillDropdown.set(true)"
              (blur)="onSkillBlur()"
              (keydown.arrowdown)="onSkillKeyDown($event, 'down')"
              (keydown.arrowup)="onSkillKeyDown($event, 'up')"
              (keydown.enter)="onSkillKeyDown($event, 'enter')"
              (keydown.escape)="showSkillDropdown.set(false)"
              placeholder="Type to search skills..."
              class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autofocus
            />

            <!-- Autocomplete Dropdown -->
            @if (showSkillDropdown() && filteredSkills().length > 0) {
            <div class="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl">
              @for (skill of filteredSkills(); track skill; let i = $index) {
              <button
                type="button"
                (mousedown)="selectSkillFromDropdown(skill)"
                [class]="skillDropdownIndex() === i
                  ? 'w-full px-4 py-2.5 text-left hover:bg-neutral-700 transition-colors text-white bg-neutral-800'
                  : 'w-full px-4 py-2.5 text-left hover:bg-neutral-800 transition-colors text-white'"
              >
                {{ skill }}
              </button>
              }
            </div>
            }
          </div>

          <!-- Star Rating -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-neutral-400">Proficiency:</span>
            <div class="flex gap-1">
              @for (star of [1,2,3,4,5]; track star) {
              <button
                type="button"
                (click)="newSkillRating.set(star)"
                class="transition-all duration-200 hover:scale-110"
              >
                <svg
                  class="w-6 h-6"
                  [class]="
                    star <= newSkillRating()
                      ? 'text-purple-500 fill-purple-500'
                      : 'text-neutral-600'
                  "
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
              }
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              (click)="addSkill()"
              [disabled]="!newSkillName().trim()"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg transition-all"
            >
              Add
            </button>
            <button
              type="button"
              (click)="cancelAddSkill()"
              class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
        }

        <!-- Skills List -->
        @if (skills().length > 0) {
        <div class="space-y-3">
          @for (skill of skills(); track skill.skill) {
          <div
            class="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/50 flex items-center justify-between group hover:border-neutral-600 transition-all"
          >
            <div class="flex-1 flex items-center gap-4">
              <span class="text-white font-medium">{{ skill.skill }}</span>

              <!-- Star Rating Display -->
              <div class="flex gap-1">
                @for (star of [1,2,3,4,5]; track star) {
                <button
                  type="button"
                  (click)="updateSkillProficiency(skill, star)"
                  class="transition-all duration-200 hover:scale-110"
                >
                  <svg
                    class="w-5 h-5"
                    [class]="
                      star <= skill.rating
                        ? 'text-purple-500 fill-purple-500'
                        : 'text-neutral-600'
                    "
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
                }
              </div>
            </div>

            <!-- Remove Button -->
            <button
              type="button"
              (click)="removeSkill(skill)"
              class="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          }
        </div>
        } @else {
        <div
          class="bg-neutral-800/20 rounded-xl p-6 border border-dashed border-neutral-700 text-center"
        >
          <p class="text-neutral-400 text-sm">
            no skills added yet, tap
            <button
              (click)="startAddSkill()"
              class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-all mx-1"
            >
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            to add skills
          </p>
        </div>
        }

        <!-- Add Skill Button -->
        @if (!isAddingSkill() && skills().length > 0) {
        <button
          type="button"
          (click)="startAddSkill()"
          class="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
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
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm font-medium">add skill</span>
        </button>
        }
      </div>
    </div>
  `,
  styles: ``,
})
export class LanguagesSkillsSectionComponent implements OnInit {
  @Input() profile: Profile | null = null;
  @Output() save = new EventEmitter<any>();

  languages = signal<Language[]>([]);
  skills = signal<Skill[]>([]);

  isAddingLanguage = signal(false);
  isAddingSkill = signal(false);
  isSaving = signal(false);
  hasChanges = signal(false);

  newLanguageName = signal('');
  newLanguageProficiency = signal(3);
  newSkillName = signal('');
  newSkillRating = signal(3);

  // Autocomplete dropdown signals
  showLanguageDropdown = signal(false);
  showSkillDropdown = signal(false);
  languageDropdownIndex = signal(0);
  skillDropdownIndex = signal(0);

  // Standardized list of common languages (Indian + global)
  readonly availableLanguages: string[] = [
    // Indian languages
    'Hindi',
    'English',
    'Bengali',
    'Telugu',
    'Marathi',
    'Tamil',
    'Gujarati',
    'Urdu',
    'Kannada',
    'Odia',
    'Malayalam',
    'Punjabi',
    'Assamese',
    'Maithili',
    'Konkani',
    'Manipuri',
    'Sindhi',
    'Kashmiri',
    'Dogri',

    // Other widely-used languages
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese (Mandarin)',
    'Japanese',
    'Korean',
    'Arabic',
  ];

  // Standardized list of common acting skills
  readonly availableSkills: string[] = [
    'Acting',
    'Dance',
    'Singing',
    'Voice Acting',
    'Dubbing',
    'Stage Performance',
    'Classical Dance',
    'Contemporary Dance',
    'Hip Hop',
    'Ballet',
    'Bharatanatyam',
    'Kathak',
    'Kuchipudi',
    'Odissi',
    'Mohiniyattam',
    'Kathakali',
    'Martial Arts',
    'Stunts',
    'Horse Riding',
    'Swimming',
    'Gymnastics',
    'Acrobatics',
    'Comedy',
    'Stand-up Comedy',
    'Improv',
    'Mimicry',
    'Musical Instrument',
    'Guitar',
    'Piano',
    'Drums',
    'Tabla',
    'Flute',
    'Harmonium',
    'Method Acting',
    'Classical Acting',
    'Physical Theatre',
    'Puppetry',
    'Mime',
    'Sketch Comedy',
    'Voice Modulation',
    'Dialect/Accent',
    'Action Choreography',
    'Fight Choreography',
  ];

  // Computed filtered lists
  filteredLanguages = computed(() => {
    const searchTerm = this.newLanguageName().toLowerCase().trim();
    const selected = this.languages().map((l) => l.language.toLowerCase());

    if (!searchTerm) {
      return this.availableLanguages.filter(
        (lang) => !selected.includes(lang.toLowerCase())
      );
    }

    return this.availableLanguages.filter(
      (lang) =>
        !selected.includes(lang.toLowerCase()) &&
        lang.toLowerCase().includes(searchTerm)
    );
  });

  filteredSkills = computed(() => {
    const searchTerm = this.newSkillName().toLowerCase().trim();
    const selected = this.skills().map((s) => s.skill.toLowerCase());

    if (!searchTerm) {
      return this.availableSkills.filter(
        (skill) => !selected.includes(skill.toLowerCase())
      );
    }

    return this.availableSkills.filter(
      (skill) =>
        !selected.includes(skill.toLowerCase()) &&
        skill.toLowerCase().includes(searchTerm)
    );
  });

  ngOnInit() {
    this.populateData();
  }

  populateData() {
    if (!this.profile?.actorProfile) return;

    const langs = this.profile.actorProfile.languages || [];
    this.languages.set(
      langs.map((lang) => ({
        language: typeof lang === 'string' ? lang : lang.language,
        rating: typeof lang === 'string' ? 3 : lang.rating,
      }))
    );

    const skillsList = this.profile.actorProfile.skills || [];
    this.skills.set(
      skillsList.map((skill) => ({
        skill: typeof skill === 'string' ? skill : skill.skill,
        rating: typeof skill === 'string' ? 3 : skill.rating,
      }))
    );
  }

  // Language autocomplete handlers
  onLanguageInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.newLanguageName.set(input.value);
    this.showLanguageDropdown.set(true);
    this.languageDropdownIndex.set(0);
  }

  onLanguageBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showLanguageDropdown.set(false);
      this.languageDropdownIndex.set(0);
    }, 200);
  }

  onLanguageKeyDown(event: Event, action: 'up' | 'down' | 'enter') {
    const keyEvent = event as KeyboardEvent;
    const filtered = this.filteredLanguages();

    if (action === 'down') {
      keyEvent.preventDefault();
      const newIndex = Math.min(this.languageDropdownIndex() + 1, filtered.length - 1);
      this.languageDropdownIndex.set(newIndex);
    } else if (action === 'up') {
      keyEvent.preventDefault();
      const newIndex = Math.max(this.languageDropdownIndex() - 1, 0);
      this.languageDropdownIndex.set(newIndex);
    } else if (action === 'enter') {
      keyEvent.preventDefault();
      if (this.showLanguageDropdown() && filtered.length > 0) {
        const selectedLang = filtered[this.languageDropdownIndex()];
        this.selectLanguageFromDropdown(selectedLang);
      } else {
        this.addLanguage();
      }
    }
  }

  selectLanguageFromDropdown(language: string) {
    this.newLanguageName.set(language);
    this.showLanguageDropdown.set(false);
    this.languageDropdownIndex.set(0);
  }

  // Skill autocomplete handlers
  onSkillInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.newSkillName.set(input.value);
    this.showSkillDropdown.set(true);
    this.skillDropdownIndex.set(0);
  }

  onSkillBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showSkillDropdown.set(false);
      this.skillDropdownIndex.set(0);
    }, 200);
  }

  onSkillKeyDown(event: Event, action: 'up' | 'down' | 'enter') {
    const keyEvent = event as KeyboardEvent;
    const filtered = this.filteredSkills();

    if (action === 'down') {
      keyEvent.preventDefault();
      const newIndex = Math.min(this.skillDropdownIndex() + 1, filtered.length - 1);
      this.skillDropdownIndex.set(newIndex);
    } else if (action === 'up') {
      keyEvent.preventDefault();
      const newIndex = Math.max(this.skillDropdownIndex() - 1, 0);
      this.skillDropdownIndex.set(newIndex);
    } else if (action === 'enter') {
      keyEvent.preventDefault();
      if (this.showSkillDropdown() && filtered.length > 0) {
        const selectedSkill = filtered[this.skillDropdownIndex()];
        this.selectSkillFromDropdown(selectedSkill);
      } else {
        this.addSkill();
      }
    }
  }

  selectSkillFromDropdown(skill: string) {
    this.newSkillName.set(skill);
    this.showSkillDropdown.set(false);
    this.skillDropdownIndex.set(0);
  }

  // Language Methods
  startAddLanguage() {
    this.isAddingLanguage.set(true);
    this.newLanguageName.set('');
    this.newLanguageProficiency.set(3);
    this.showLanguageDropdown.set(false);
    this.languageDropdownIndex.set(0);
  }

  addLanguage() {
    const name = this.newLanguageName().trim();
    if (!name) return;

    const currentLangs = this.languages();
    if (
      currentLangs.some((l) => l.language.toLowerCase() === name.toLowerCase())
    ) {
      alert('This language is already added');
      return;
    }

    this.languages.set([
      ...currentLangs,
      { language: name, rating: this.newLanguageProficiency() },
    ]);
    this.hasChanges.set(true);
    this.triggerAutosave();
    this.cancelAddLanguage();
  }

  cancelAddLanguage() {
    this.isAddingLanguage.set(false);
    this.newLanguageName.set('');
  }

  updateLanguageProficiency(lang: Language, rating: number) {
    const currentLangs = this.languages();
    const updated = currentLangs.map((l) =>
      l.language === lang.language ? { ...l, rating } : l
    );
    this.languages.set(updated);
    this.hasChanges.set(true);
    this.triggerAutosave();
  }

  removeLanguage(lang: Language) {
    const currentLangs = this.languages();
    this.languages.set(
      currentLangs.filter((l) => l.language !== lang.language)
    );
    this.hasChanges.set(true);
    this.triggerAutosave();
  }

  // Skill Methods
  startAddSkill() {
    this.isAddingSkill.set(true);
    this.newSkillName.set('');
    this.newSkillRating.set(3);
    this.showSkillDropdown.set(false);
    this.skillDropdownIndex.set(0);
  }

  addSkill() {
    const name = this.newSkillName().trim();
    if (!name) return;

    const currentSkills = this.skills();
    if (
      currentSkills.some((s) => s.skill.toLowerCase() === name.toLowerCase())
    ) {
      alert('This skill is already added');
      return;
    }

    this.skills.set([
      ...currentSkills,
      { skill: name, rating: this.newSkillRating() },
    ]);
    this.hasChanges.set(true);
    this.triggerAutosave();
    this.cancelAddSkill();
  }

  cancelAddSkill() {
    this.isAddingSkill.set(false);
    this.newSkillName.set('');
  }

  updateSkillProficiency(skill: Skill, rating: number) {
    const currentSkills = this.skills();
    const updated = currentSkills.map((s) =>
      s.skill === skill.skill ? { ...s, rating } : s
    );
    this.skills.set(updated);
    this.hasChanges.set(true);
    this.triggerAutosave();
  }

  removeSkill(skill: Skill) {
    const currentSkills = this.skills();
    this.skills.set(currentSkills.filter((s) => s.skill !== skill.skill));
    this.hasChanges.set(true);
    this.triggerAutosave();
  }

  private triggerAutosave() {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    this.save.emit({
      languages: this.languages(),
      skills: this.skills(),
      autosave: true,
    });

    setTimeout(() => {
      this.isSaving.set(false);
      this.hasChanges.set(false);
    }, 800);
  }
}
