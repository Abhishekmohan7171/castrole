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
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Profile } from '../../../../assets/interfaces/profile.interfaces';

@Component({
  selector: 'app-basic-info-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      <!-- Profile Image Upload -->
      <div class="flex flex-col items-center">
        <div class="relative group">
          <div
            class="w-40 h-40 rounded-full overflow-hidden bg-neutral-800 ring-4 ring-neutral-700 transition-all duration-300 group-hover:ring-purple-500/50"
          >
            @if (profileImageUrl()) {
            <img
              [src]="profileImageUrl()"
              alt="Profile"
              class="w-full h-full object-cover"
            />
            } @else {
            <div class="w-full h-full flex items-center justify-center">
              <svg
                class="w-16 h-16 text-neutral-600"
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
            </div>
            }
          </div>

          <!-- Upload Button Overlay -->
          <button
            type="button"
            (click)="fileInput.click()"
            class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 text-white mx-auto mb-1"
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
              <span class="text-xs text-white font-medium">Change Photo</span>
            </div>
          </button>

          <input
            #fileInput
            type="file"
            accept="image/*"
            (change)="onImageSelect($event)"
            class="hidden"
          />
        </div>

        @if (isUploading()) {
        <p class="text-sm text-purple-400 mt-3">Uploading...</p>
        }

        <p class="text-xs text-neutral-500 mt-3 text-center max-w-xs">
          Click to upload profile image
        </p>
      </div>

      <!-- Form Fields -->
      <form [formGroup]="form" class="space-y-6">
        <!-- Stage Name / Name -->
        <div>
          <label
            class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
          >
            {{ isActor ? 'stage name' : 'name' }} *
          </label>
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <input
              type="text"
              [formControlName]="isActor ? 'stageName' : 'name'"
              [class.border-red-500]="
                form.get(isActor ? 'stageName' : 'name')?.invalid &&
                form.get(isActor ? 'stageName' : 'name')?.touched
              "
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              (blur)="onFieldBlur()"
              [placeholder]="isActor ? 'lil rahul nair' : 'enter name'"
            />
          </div>
          @if (form.get(isActor ? 'stageName' : 'name')?.invalid &&
          form.get(isActor ? 'stageName' : 'name')?.touched) {
          <p class="text-xs text-red-400 mt-1.5 ml-1">
            @if (form.get(isActor ? 'stageName' : 'name')?.errors?.['required'])
            {
            {{ isActor ? 'Stage name' : 'Name' }} is required } @if
            (form.get(isActor ? 'stageName' : 'name')?.errors?.['minlength']) {
            {{ isActor ? 'Stage name' : 'Name' }} must be at least 2 characters
            } @if (form.get(isActor ? 'stageName' :
            'name')?.errors?.['maxlength']) {
            {{ isActor ? 'Stage name' : 'Name' }} must be
            {{ isActor ? 50 : 100 }} characters or less }
          </p>
          }
        </div>

        @if (isActor) {
        <!-- Height and Weight Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Height -->
          <div>
            <label
              class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
              >height</label
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <input
                type="number"
                formControlName="height"
                min="0"
                step="0.1"
                [class.border-red-500]="
                  form.get('height')?.invalid && form.get('height')?.touched
                "
                class="w-full pl-12 pr-16 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                (blur)="onFieldBlur()"
                placeholder="180"
              />
              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium"
                >cms</span
              >
            </div>
            @if (form.get('height')?.invalid && form.get('height')?.touched) {
            <p class="text-xs text-red-400 mt-1.5 ml-1">
              Please enter height in centimeters
            </p>
            }
          </div>

          <!-- Weight -->
          <div>
            <label
              class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
              >weight</label
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <input
                type="number"
                formControlName="weight"
                min="0"
                step="0.1"
                [class.border-red-500]="
                  form.get('weight')?.invalid && form.get('weight')?.touched
                "
                class="w-full pl-12 pr-16 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                (blur)="onFieldBlur()"
                placeholder="75"
              />
              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium"
                >kg</span
              >
            </div>
            @if (form.get('weight')?.invalid && form.get('weight')?.touched) {
            <p class="text-xs text-red-400 mt-1.5 ml-1">
              Please enter weight in kilograms
            </p>
            }
          </div>
        </div>
        } @if (isActor) {
        <!-- Age and Gender Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Age -->
          <div>
            <label
              class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
              >age *</label
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <input
                type="number"
                formControlName="age"
                min="16"
                max="100"
                [class.border-red-500]="
                  form.get('age')?.invalid && form.get('age')?.touched
                "
                class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                (blur)="onFieldBlur()"
                placeholder="25"
              />
            </div>
            @if (form.get('age')?.invalid && form.get('age')?.touched) {
            <p class="text-xs text-red-400 mt-1.5 ml-1">
              @if (form.get('age')?.errors?.['required']) { Age is required }
              @if (form.get('age')?.errors?.['min']) { Age must be at least 16 }
              @if (form.get('age')?.errors?.['max']) { Age must be 100 or less }
            </p>
            }
          </div>

          <!-- Gender -->
          <div>
            <label
              class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
            >
              gender <span class="text-red-400">*</span>
            </label>
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <select
                formControlName="gender"
                [class.border-red-500]="
                  form.get('gender')?.invalid && form.get('gender')?.touched
                "
                class="w-full pl-12 pr-10 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg appearance-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer"
                (blur)="onFieldBlur()"
              >
                <option
                  value=""
                  disabled
                  class="bg-neutral-900 text-neutral-500"
                >
                  Select gender identity
                </option>
                <option value="male" class="bg-neutral-900 text-white">
                  male
                </option>
                <option value="female" class="bg-neutral-900 text-white">
                  female
                </option>
                <option value="non-binary" class="bg-neutral-900 text-white">
                  non-binary
                </option>
                <option value="transgender" class="bg-neutral-900 text-white">
                  transgender
                </option>
                <option value="genderqueer" class="bg-neutral-900 text-white">
                  genderqueer
                </option>
                <option value="genderfluid" class="bg-neutral-900 text-white">
                  genderfluid
                </option>
                <option value="agender" class="bg-neutral-900 text-white">
                  agender
                </option>
                <option value="two-spirit" class="bg-neutral-900 text-white">
                  two-spirit
                </option>
                <option value="other" class="bg-neutral-900 text-white">
                  other
                </option>
                <option
                  value="prefer-not-to-say"
                  class="bg-neutral-900 text-white"
                >
                  prefer not to say
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
            @if (form.get('gender')?.invalid && form.get('gender')?.touched) {
            <p class="text-xs text-red-400 mt-1.5 ml-1">Gender is required</p>
            }
          </div>
        </div>
        } @if (!isActor) {
        <!-- Producer-specific fields -->
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
        }

        <!-- Location -->
        <div>
          <label
            class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide"
          >
            location <span class="text-red-400">*</span>
          </label>
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              formControlName="location"
              [class.border-red-500]="
                form.get('location')?.invalid && form.get('location')?.touched
              "
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              (blur)="onFieldBlur()"
              placeholder="ernakulam"
            />
          </div>
          @if (form.get('location')?.invalid && form.get('location')?.touched) {
          <p class="text-xs text-red-400 mt-1.5 ml-1">
            @if (form.get('location')?.errors?.['required']) { Location is
            required } @if (form.get('location')?.errors?.['minlength']) {
            Location must be at least 2 characters }
          </p>
          }
        </div>
      </form>
    </div>
  `,
  styles: ``,
})
export class BasicInfoSectionComponent implements OnInit {
  @Input() profile: Profile | null = null;
  @Input() isActor: boolean = false;
  @Output() save = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private storage = inject(Storage);

  form!: FormGroup;
  profileImageUrl = signal<string | null>(null);
  isUploading = signal(false);
  isSaving = signal(false);
  private autosaveTimeout: any;

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  initializeForm() {
    if (this.isActor) {
      this.form = this.fb.group({
        stageName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        height: ['', [Validators.min(0), Validators.max(300)]],
        weight: ['', [Validators.min(0), Validators.max(500)]],
        age: [
          '',
          [Validators.required, Validators.min(16), Validators.max(100)],
        ],
        gender: ['', Validators.required],
        location: ['', [Validators.required, Validators.minLength(2)]],
      });
    } else {
      this.form = this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ],
        ],
        designation: ['', [Validators.maxLength(100)]],
        productionHouse: ['', [Validators.maxLength(100)]],
        industryType: [''],
        location: ['', [Validators.required, Validators.minLength(2)]],
      });
    }
  }

  populateForm() {
    if (!this.profile) return;

    if (this.isActor && this.profile.actorProfile) {
      // Parse height and weight to extract numeric values
      const heightValue = this.profile.actorProfile.height
        ? parseFloat(this.profile.actorProfile.height.replace(/[^\d.]/g, '')) ||
          ''
        : '';
      const weightValue = this.profile.actorProfile.weight
        ? parseFloat(this.profile.actorProfile.weight.replace(/[^\d.]/g, '')) ||
          ''
        : '';

      this.form.patchValue({
        stageName: this.profile.actorProfile.stageName || '',
        height: heightValue,
        weight: weightValue,
        age: this.profile.age || '',
        gender: this.profile.gender || '',
        location: this.profile.location || '',
      });
      this.profileImageUrl.set(
        this.profile.actorProfile.actorProfileImageUrl || null
      );
    } else if (this.profile.producerProfile) {
      this.form.patchValue({
        name: this.profile.producerProfile.name || '',
        designation: this.profile.producerProfile.designation || '',
        productionHouse: this.profile.producerProfile.productionHouse || '',
        industryType: this.profile.producerProfile.industryType || '',
        location: this.profile.location || '',
      });
      this.profileImageUrl.set(
        this.profile.producerProfile.producerProfileImageUrl || null
      );
    }

    // Mark form as pristine after initial population
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  async onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    this.isUploading.set(true);

    try {
      // Compress image
      const compressedBlob = await this.compressImage(file);

      // Upload to Firebase Storage in users/:userid/images directory
      const timestamp = Date.now();
      const fileName = `users/${this.profile?.uid}/images/profile_${timestamp}.jpg`;
      const storageRef = ref(this.storage, fileName);

      await uploadBytes(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(storageRef);

      this.profileImageUrl.set(downloadURL);
      this.onSave();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      this.isUploading.set(false);
    }
  }

  private async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Max dimensions
          const maxWidth = 800;
          const maxHeight = 800;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  onSave() {
    if (this.form.invalid) return;

    this.isSaving.set(true);

    const formValue = this.form.value;
    const data: any = {
      location: formValue.location,
      profileImageUrl: this.profileImageUrl(),
    };

    if (this.isActor) {
      data.age = formValue.age;
      data.gender = formValue.gender;
      data.stageName = formValue.stageName;
      data.height = formValue.height ? `${formValue.height} cms` : '';
      data.weight = formValue.weight ? `${formValue.weight} kg` : '';
    } else {
      data.name = formValue.name;
      data.designation = formValue.designation;
      data.productionHouse = formValue.productionHouse;
      data.industryType = formValue.industryType;
    }

    data.autosave = true;

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
