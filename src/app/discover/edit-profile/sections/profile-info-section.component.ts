import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Profile, Work } from '../../../../assets/interfaces/profile.interfaces';

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
  selector: 'app-profile-info-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      <form [formGroup]="profileFieldsGroup" class="space-y-6">
        <!-- Designation -->
        <div>
          <label
            class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
            >designation</label
          >
          <div class="relative">
            <div
              class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                />
              </svg>
            </div>
            <input
              type="text"
              formControlName="designation"
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              (blur)="onFieldBlur()"
              placeholder="director"
            />
          </div>
        </div>

        <!-- Production House -->
        <div>
          <label
            class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
            >production house</label
          >
          <div class="relative">
            <div
              class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <input
              type="text"
              formControlName="productionHouse"
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              (blur)="onFieldBlur()"
              placeholder="dharma productions"
            />
          </div>
        </div>

        <!-- Industry Type -->
        <div>
          <label
            class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
            >industry type</label
          >
          <div class="relative">
            <div
              class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 z-10"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-8 0h8m-8 0V3a1 1 0 011-1h6a1 1 0 011 1v1M7 4L5.5 6m13-2L20 6m-2 0H6l-.5 2.5h13L18 6z"
                />
              </svg>
            </div>
            <select
              formControlName="industryType"
              class="w-full pl-12 pr-10 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg appearance-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer"
              (blur)="onFieldBlur()"
            >
              <option value="" disabled class="bg-neutral-900 text-neutral-500">
                Select industry type
              </option>
              <option value="film" class="bg-neutral-900 text-white">
                film
              </option>
              <option value="television" class="bg-neutral-900 text-white">
                television
              </option>
              <option value="web-series" class="bg-neutral-900 text-white">
                web series
              </option>
              <option value="advertisement" class="bg-neutral-900 text-white">
                advertisement
              </option>
              <option value="music-video" class="bg-neutral-900 text-white">
                music video
              </option>
              <option value="documentary" class="bg-neutral-900 text-white">
                documentary
              </option>
              <option value="short-film" class="bg-neutral-900 text-white">
                short film
              </option>
              <option value="theater" class="bg-neutral-900 text-white">
                theater
              </option>
              <option value="other" class="bg-neutral-900 text-white">
                other
              </option>
            </select>
            <div
              class="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </form>

      <!-- Previous Works Section -->
      <div class="mt-8 pt-8 border-t border-neutral-700">
        <h3 class="text-xl font-semibold text-white mb-6">previous works</h3>

        <!-- Existing Works -->
        @if (worksArray.length > 0) {
          <div class="space-y-4 mb-6">
            @for (work of worksArray.controls; track $index) {
              <div class="bg-neutral-800/30 rounded-xl p-6 border border-neutral-700/50 space-y-4">
                <!-- Header with Edit Icon -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-medium text-white">
                      {{ work.get('projectName')?.value || 'Project ' + ($index + 1) }}
                    </h3>
                    <p class="text-sm text-neutral-400 mt-1">
                      {{ work.get('genre')?.value || 'Genre not specified' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="toggleWorkEditMode($index)"
                    class="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>

                <!-- Edit Mode -->
                @if (editingWorkIndex() === $index) {
                  <form [formGroup]="getWorkFormGroup($index)" class="space-y-4">
                    <!-- Project Name -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">project name</label>
                      <input
                        type="text"
                        formControlName="projectName"
                        (blur)="onFieldBlur()"
                        placeholder="KGF Chapter 2"
                        class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <!-- Genre -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">genre</label>
                      <input
                        type="text"
                        formControlName="genre"
                        (blur)="onFieldBlur()"
                        placeholder="action thriller"
                        class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <!-- Year -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-neutral-300">year</label>
                      <input
                        type="text"
                        formControlName="year"
                        (blur)="onFieldBlur()"
                        placeholder="2021"
                        class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        (click)="saveWork($index)"
                        [disabled]="getWorkFormGroup($index).invalid"
                        class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
                      >
                        save work
                      </button>
                      <button
                        type="button"
                        (click)="removeWork($index)"
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
                      <span>{{ work.get('year')?.value }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Add Work Button -->
        <button
          type="button"
          (click)="addWork()"
          class="w-full md:w-auto px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          add project
        </button>
      </div>
    </div>
  `,
  styles: ``,
})
export class ProfileInfoSectionComponent implements OnInit {
  @Input() profile: Profile | null = null;
  @Output() save = new EventEmitter<any>();

  private fb = inject(FormBuilder);

  form!: FormGroup;
  isSaving = signal(false);
  editingWorkIndex = signal<number | null>(null);
  private autosaveTimeout: any;

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  initializeForm() {
    this.form = this.fb.group({
      profileFields: this.fb.group({
        designation: ['', [Validators.maxLength(100)]],
        productionHouse: ['', [Validators.maxLength(100)]],
        industryType: [''],
      }),
      works: this.fb.array([]),
    });
  }

  populateForm() {
    if (!this.profile?.producerProfile) return;

    // Populate simple fields
    this.profileFieldsGroup.patchValue({
      designation: this.profile.producerProfile.designation || '',
      productionHouse: this.profile.producerProfile.productionHouse || '',
      industryType: this.profile.producerProfile.industryType || '',
    });

    // Populate works
    const works = this.profile.producerProfile.producerWorks || [];
    works.forEach((work) => {
      this.worksArray.push(this.createWorkFormGroup(work));
    });

    // Auto-expand first work if exists
    if (works.length > 0) {
      this.editingWorkIndex.set(0);
    }

    // Mark form as pristine after initial population
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // Getter methods
  get profileFieldsGroup(): FormGroup {
    return this.form.get('profileFields') as FormGroup;
  }

  get worksArray(): FormArray {
    return this.form.get('works') as FormArray;
  }

  getWorkFormGroup(index: number): FormGroup {
    return this.worksArray.at(index) as FormGroup;
  }

  // Work management methods
  createWorkFormGroup(work?: Work): FormGroup {
    return this.fb.group({
      projectName: [
        work?.projectName || '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(200)],
      ],
      genre: [work?.genre || '', [Validators.maxLength(100)]],
      year: [
        work?.year || '',
        [Validators.required, Validators.pattern(/^\d{4}$/), yearRangeValidator],
      ],
    });
  }

  addWork() {
    const newWork = this.createWorkFormGroup();
    this.worksArray.push(newWork);
    this.editingWorkIndex.set(this.worksArray.length - 1);
  }

  toggleWorkEditMode(index: number) {
    if (this.editingWorkIndex() === index) {
      this.editingWorkIndex.set(null);
    } else {
      this.editingWorkIndex.set(index);
    }
  }

  saveWork(index: number) {
    const workGroup = this.getWorkFormGroup(index);
    if (workGroup.invalid) return;

    this.editingWorkIndex.set(null);
    this.onFieldBlur(); // Trigger auto-save
  }

  removeWork(index: number) {
    if (confirm('Are you sure you want to remove this project?')) {
      this.worksArray.removeAt(index);
      this.editingWorkIndex.set(null);
      this.onFieldBlur(); // Trigger auto-save
    }
  }

  onSave() {
    if (this.form.invalid) return;

    this.isSaving.set(true);

    const profileFieldsValue = this.profileFieldsGroup.value;

    // Filter out incomplete works (must have projectName and year)
    const validatedWorks = this.worksArray.value.filter(
      (work: Work) => work.projectName && work.year
    );

    const data: any = {
      designation: profileFieldsValue.designation,
      productionHouse: profileFieldsValue.productionHouse,
      industryType: profileFieldsValue.industryType,
      producerWorks: validatedWorks,
      autosave: true,
    };

    this.save.emit(data);

    setTimeout(() => {
      this.isSaving.set(false);
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }, 800);
  }

  onFieldBlur() {
    if (this.form.invalid || this.isSaving()) {
      return;
    }

    if (!this.form.dirty) {
      return;
    }

    if (this.autosaveTimeout) {
      clearTimeout(this.autosaveTimeout);
    }

    this.autosaveTimeout = setTimeout(() => {
      this.onSave();
    }, 400);
  }
}
