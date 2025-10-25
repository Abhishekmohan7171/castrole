import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Profile, Education } from '../../../../assets/interfaces/profile.interfaces';

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
                    {{ edu.get('schoolName')?.value || 'Education ' + ($index + 1) }}
                  </h3>
                  <p class="text-sm text-neutral-400 mt-1">
                    {{ edu.get('courseName')?.value || 'Course not specified' }}
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
                <form [formGroup]="getEducationFormGroup($index)" class="space-y-4">
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

                  <!-- Year and Certificate -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">year</label>
                      <div class="relative">
                        <input
                          type="text"
                          formControlName="yearCompleted"
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

                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">certificate</label>
                      <div class="relative">
                        <input
                          type="text"
                          [value]="edu.get('certificateUrl')?.value ? 'Certificate uploaded' : 'Upload here'"
                          readonly
                          class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-neutral-400 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          (click)="certificateInput.click()"
                        />
                        <button
                          type="button"
                          (click)="certificateInput.click()"
                          class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
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
                          class="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- View Certificate Link -->
                  @if (edu.get('certificateUrl')?.value) {
                    <a
                      [href]="edu.get('certificateUrl')?.value"
                      target="_blank"
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
                      [disabled]="getEducationFormGroup($index).invalid || isUploading()"
                      class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
                    >
                      {{ isUploading() ? 'Uploading...' : 'save education' }}
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
        add education
      </button>

      <!-- Save All Button -->
      @if (educationArray.length > 0) {
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
  isUploading = signal(false);
  isSaving = signal(false);

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  initializeForm() {
    this.form = this.fb.group({
      education: this.fb.array([])
    });
  }

  get educationArray(): FormArray {
    return this.form.get('education') as FormArray;
  }

  getEducationFormGroup(index: number): FormGroup {
    return this.educationArray.at(index) as FormGroup;
  }

  populateForm() {
    if (!this.profile || !this.isActor) return;

    const educationList = this.profile.actorProfile?.listEducation || [];
    
    educationList.forEach(edu => {
      this.educationArray.push(this.createEducationFormGroup(edu));
    });

    // Auto-expand first item if exists
    if (educationList.length > 0) {
      this.editingIndex.set(0);
    }
  }

  createEducationFormGroup(edu?: Education): FormGroup {
    return this.fb.group({
      schoolName: [edu?.schoolName || '', Validators.required],
      courseName: [edu?.courseName || '', Validators.required],
      yearCompleted: [edu?.yearCompleted || '', Validators.required],
      certificateUrl: [edu?.certificateUrl || '']
    });
  }

  addEducation() {
    const newEdu = this.createEducationFormGroup();
    this.educationArray.push(newEdu);
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
      
      this.getEducationFormGroup(index).patchValue({
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
    const eduGroup = this.getEducationFormGroup(index);
    if (eduGroup.invalid) return;

    this.editingIndex.set(null);
  }

  removeEducation(index: number) {
    if (confirm('Are you sure you want to remove this education entry?')) {
      this.educationArray.removeAt(index);
      this.editingIndex.set(null);
    }
  }

  onSaveAll() {
    if (this.form.invalid) return;

    this.isSaving.set(true);

    const educationData = this.educationArray.value.filter((edu: Education) => 
      edu.schoolName && edu.courseName && edu.yearCompleted
    );

    this.save.emit({ education: educationData });

    setTimeout(() => this.isSaving.set(false), 1000);
  }
}
