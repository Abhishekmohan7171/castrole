import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Profile, Education, Work } from '../../../../assets/interfaces/profile.interfaces';

// Custom validator for year range (1900 to current year)
function yearRangeValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const year = parseInt(control.value, 10);
  const currentYear = new Date().getFullYear();

  if (isNaN(year) || year < 1900 || year > currentYear) {
    return { yearRange: { min: 1900, max: currentYear, actual: control.value } };
  }

  return null;
}

@Component({
  selector: 'app-education-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Existing Education Entries -->
      @if (educationArray.length > 0) {
        <div class="space-y-4">
          @for (edu of educationArray.controls; track $index) {
            <div class="bg-neutral-800/30 rounded-xl p-6 border border-neutral-700/50 space-y-4">
              <!-- Header with Edit Icon -->
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-medium text-white">
                    {{ isActor 
                      ? (edu.get('schoolName')?.value || 'Education ' + ($index + 1))
                      : (edu.get('projectName')?.value || 'Project ' + ($index + 1))
                    }}
                  </h3>
                  <p class="text-sm text-neutral-400 mt-1">
                    {{ isActor 
                      ? (edu.get('courseName')?.value || 'Course not specified')
                      : (edu.get('genre')?.value || 'Genre not specified')
                    }}
                  </p>
                </div>
                <button
                  type="button"
                  (click)="toggleEditMode($index)"
                  class="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              <!-- Edit Mode -->
              @if (editingIndex() === $index) {
                <form [formGroup]="getFormGroup($index)" class="space-y-4">
                  @if (isActor) {
                    <!-- School Name -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">school name</label>
                      <div class="relative">
                        <input
                          type="text"
                          formControlName="schoolName"
                          placeholder="Swami Vivekananda Institute of film production"
                          class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <!-- Course Name -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">name of course</label>
                      <div class="relative">
                        <input
                          type="text"
                          formControlName="courseName"
                          placeholder="diploma in screen acting"
                          class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  } @else {
                    <!-- Project Name -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">project name</label>
                      <div class="relative">
                        <input
                          type="text"
                          formControlName="projectName"
                          placeholder="KGF Chapter 2"
                          class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <!-- Genre -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">genre</label>
                      <div class="relative">
                        <input
                          type="text"
                          formControlName="genre"
                          placeholder="action thriller"
                          class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <!-- Project Link -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">project link</label>
                      <div class="relative">
                        <input
                          type="url"
                          formControlName="projectLink"
                          placeholder="https://www.imdb.com/title/..."
                          class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  }

                  <!-- Year and Certificate -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">{{ isActor ? 'year completed' : 'year' }}</label>
                      <div class="relative">
                        <input
                          type="text"
                          [formControlName]="isActor ? 'yearCompleted' : 'year'"
                          placeholder="2021"
                          class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    @if (isActor) {
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">certificate</label>
                        <div class="relative">
                          <input
                            type="text"
                            [value]="isUploading() ? 'Uploading...' : (edu.get('certificateUrl')?.value ? 'Certificate uploaded ✓' : 'Upload here')"
                            readonly
                            [class]="isUploading() ? 'w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-purple-400 cursor-wait focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all' : 'w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-400 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'"
                            (click)="!isUploading() && certificateInput.click()"
                          />
                          <button
                            type="button"
                            (click)="certificateInput.click()"
                            [disabled]="isUploading()"
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <input
                            #certificateInput
                            type="file"
                            accept="image/*,.pdf"
                            (change)="onCertificateSelect($event, $index)"
                            [disabled]="isUploading()"
                            class="hidden"
                          />
                        </div>
                      </div>
                    }
                  </div>

                  <!-- View Certificate Link -->
                  @if (isActor && edu.get('certificateUrl')?.value) {
                    <a
                      [href]="edu.get('certificateUrl')?.value"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      view certificate
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  }

                  <!-- Action Buttons -->
                  <div class="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      (click)="saveEducation($index)"
                      [disabled]="getFormGroup($index).invalid || isUploading()"
                      class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
                    >
                      {{ isUploading() ? 'Uploading...' : (isActor ? 'save education' : 'save work') }}
                    </button>
                    <button
                      type="button"
                      (click)="removeEducation($index)"
                      class="px-6 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-xl transition-all duration-200"
                    >
                      remove
                    </button>
                  </div>
                </form>
              } @else {
                <!-- View Mode -->
                <div class="space-y-2">
                  <div class="flex items-center gap-2 text-sm text-neutral-400">
                    <span>{{ edu.get('yearCompleted')?.value }}</span>
                    @if (edu.get('certificateUrl')?.value) {
                      <span>•</span>
                      <a
                        [href]="edu.get('certificateUrl')?.value"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        view certificate
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Add Education Button -->
      <button
        type="button"
        (click)="addEducation()"
        class="w-full md:w-auto px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ isActor ? 'add education' : 'add project' }}
      </button>

      <!-- Experience Section (Actors Only) -->
      @if (isActor) {
        <div class="mt-12 pt-8 border-t border-neutral-700">
          <h3 class="text-xl font-semibold text-white mb-6">Experience</h3>

          <!-- Existing Experience Entries -->
          @if (experienceArray.length > 0) {
            <div class="space-y-4 mb-6">
              @for (exp of experienceArray.controls; track $index) {
                <div class="bg-neutral-800/30 rounded-xl p-6 border border-neutral-700/50 space-y-4">
                  <!-- Header with Edit Icon -->
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-medium text-white">
                        {{ exp.get('projectName')?.value || 'Experience ' + ($index + 1) }}
                      </h3>
                      <p class="text-sm text-neutral-400 mt-1">
                        {{ exp.get('genre')?.value || 'Genre not specified' }}
                      </p>
                    </div>
                    <button
                      type="button"
                      (click)="toggleExperienceEditMode($index)"
                      class="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>

                  <!-- Edit Mode -->
                  @if (editingExperienceIndex() === $index) {
                    <form [formGroup]="getExperienceFormGroup($index)" class="space-y-4">
                      <!-- Project Name -->
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">project name</label>
                        <div class="relative">
                          <input
                            type="text"
                            formControlName="projectName"
                            placeholder="KGF Chapter 2"
                            class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <!-- Genre -->
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">genre</label>
                        <div class="relative">
                          <input
                            type="text"
                            formControlName="genre"
                            placeholder="action thriller"
                            class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <!-- Project Link -->
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">project link</label>
                        <div class="relative">
                          <input
                            type="url"
                            formControlName="projectLink"
                            placeholder="https://www.imdb.com/title/..."
                            class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <!-- Year -->
                      <div class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300">year</label>
                        <div class="relative">
                          <input
                            type="text"
                            formControlName="year"
                            placeholder="2021"
                            class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                          <button
                            type="button"
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          (click)="saveExperience($index)"
                          [disabled]="getExperienceFormGroup($index).invalid"
                          class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
                        >
                          save experience
                        </button>
                        <button
                          type="button"
                          (click)="removeExperience($index)"
                          class="px-6 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-xl transition-all duration-200"
                        >
                          remove
                        </button>
                      </div>
                    </form>
                  } @else {
                    <!-- View Mode -->
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-sm text-neutral-400">
                        <span>{{ exp.get('year')?.value }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Add Experience Button -->
          <button
            type="button"
            (click)="addExperience()"
            class="w-full md:w-auto px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            add experience
          </button>
        </div>
      }

      <!-- Save All Button -->
      @if (educationArray.length > 0 || experienceArray.length > 0) {
        <div class="flex justify-end pt-4">
          <button
            type="button"
            (click)="onSaveAll()"
            [disabled]="isSaving()"
            class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            {{ isSaving() ? 'Saving...' : 'Save All Changes' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: ``
})
export class EducationSectionComponent implements OnInit {
  @Input() profile: Profile | null = null;
  @Input() isActor = false;
  @Output() save = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private storage = inject(Storage);

  form!: FormGroup;
  editingIndex = signal<number | null>(null);
  editingExperienceIndex = signal<number | null>(null);
  isUploading = signal(false);
  isSaving = signal(false);

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  initializeForm() {
    this.form = this.fb.group({
      items: this.fb.array([]),
      experienceItems: this.fb.array([])
    });
  }

  get educationArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get experienceArray(): FormArray {
    return this.form.get('experienceItems') as FormArray;
  }

  getFormGroup(index: number): FormGroup {
    return this.educationArray.at(index) as FormGroup;
  }

  getExperienceFormGroup(index: number): FormGroup {
    return this.experienceArray.at(index) as FormGroup;
  }

  populateForm() {
    if (!this.profile) return;

    if (this.isActor) {
      // Load education
      const educationList = this.profile.actorProfile?.listEducation || [];
      educationList.forEach(edu => {
        this.educationArray.push(this.createEducationFormGroup(edu));
      });
      // Auto-expand first item if exists
      if (educationList.length > 0) {
        this.editingIndex.set(0);
      }

      // Load experiences (actorWorks)
      const experienceList = this.profile.actorProfile?.actorWorks || [];
      experienceList.forEach(work => {
        this.experienceArray.push(this.createWorkFormGroup(work));
      });
    } else {
      const worksList = this.profile.producerProfile?.producerWorks || [];
      worksList.forEach(work => {
        this.educationArray.push(this.createWorkFormGroup(work));
      });
      // Auto-expand first item if exists
      if (worksList.length > 0) {
        this.editingIndex.set(0);
      }
    }
  }

  createEducationFormGroup(edu?: Education): FormGroup {
    return this.fb.group({
      schoolName: [edu?.schoolName || '', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      courseName: [edu?.courseName || '', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      yearCompleted: [edu?.yearCompleted || '', [Validators.required, Validators.pattern(/^\d{4}$/), yearRangeValidator]],
      certificateUrl: [edu?.certificateUrl || '']
    });
  }

  createWorkFormGroup(work?: Work): FormGroup {
    return this.fb.group({
      projectName: [work?.projectName || '', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      genre: [work?.genre || '', [Validators.maxLength(100)]],
      year: [work?.year || '', [Validators.required, Validators.pattern(/^\d{4}$/), yearRangeValidator]],
      projectLink: [work?.projectLink || '', [Validators.maxLength(500)]]
    });
  }

  addEducation() {
    const newItem = this.isActor ? this.createEducationFormGroup() : this.createWorkFormGroup();
    this.educationArray.push(newItem);
    this.editingIndex.set(this.educationArray.length - 1);
  }

  toggleEditMode(index: number) {
    if (this.editingIndex() === index) {
      this.editingIndex.set(null);
    } else {
      this.editingIndex.set(index);
    }
  }

  async onCertificateSelect(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    this.isUploading.set(true);

    try {
      const timestamp = Date.now();
      const fileName = `certificates/${this.profile?.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(this.storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      this.getFormGroup(index).patchValue({
        certificateUrl: downloadURL
      });
    } catch (error) {
      console.error('Error uploading certificate:', error);
      alert('Failed to upload certificate. Please try again.');
    } finally {
      this.isUploading.set(false);
    }
  }

  saveEducation(index: number) {
    const itemGroup = this.getFormGroup(index);
    if (itemGroup.invalid) return;

    this.editingIndex.set(null);
  }

  removeEducation(index: number) {
    const itemType = this.isActor ? 'education entry' : 'project';
    if (confirm(`Are you sure you want to remove this ${itemType}?`)) {
      this.educationArray.removeAt(index);
      this.editingIndex.set(null);
    }
  }

  // Experience methods
  addExperience() {
    const newWork = this.createWorkFormGroup();
    this.experienceArray.push(newWork);
    this.editingExperienceIndex.set(this.experienceArray.length - 1);
  }

  toggleExperienceEditMode(index: number) {
    if (this.editingExperienceIndex() === index) {
      this.editingExperienceIndex.set(null);
    } else {
      this.editingExperienceIndex.set(index);
    }
  }

  saveExperience(index: number) {
    const itemGroup = this.getExperienceFormGroup(index);
    if (itemGroup.invalid) return;

    this.editingExperienceIndex.set(null);
  }

  removeExperience(index: number) {
    if (confirm('Are you sure you want to remove this experience?')) {
      this.experienceArray.removeAt(index);
      this.editingExperienceIndex.set(null);
    }
  }

  onSaveAll() {
    if (this.form.invalid) return;

    this.isSaving.set(true);

    if (this.isActor) {
      const educationData = this.educationArray.value.filter((edu: Education) =>
        edu.schoolName && edu.courseName && edu.yearCompleted
      );
      const experienceData = this.experienceArray.value.filter((work: Work) =>
        work.projectName && work.year
      );
      this.save.emit({ education: educationData, actorWorks: experienceData });
    } else {
      const worksData = this.educationArray.value.filter((work: Work) =>
        work.projectName && work.year
      );
      this.save.emit({ works: worksData });
    }

    setTimeout(() => this.isSaving.set(false), 1000);
  }
}
