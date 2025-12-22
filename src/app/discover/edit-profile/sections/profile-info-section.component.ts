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
import { Profile } from '../../../../assets/interfaces/profile.interfaces';

@Component({
  selector: 'app-profile-info-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8">
      <form [formGroup]="form" class="space-y-6">
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
  private autosaveTimeout: any;

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  initializeForm() {
    this.form = this.fb.group({
      designation: ['', [Validators.maxLength(100)]],
      productionHouse: ['', [Validators.maxLength(100)]],
      industryType: [''],
    });
  }

  populateForm() {
    if (!this.profile?.producerProfile) return;

    // Populate simple fields
    this.form.patchValue({
      designation: this.profile.producerProfile.designation || '',
      productionHouse: this.profile.producerProfile.productionHouse || '',
      industryType: this.profile.producerProfile.industryType || '',
    });

    // Mark form as pristine after initial population
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onSave() {
    if (this.form.invalid) return;

    this.isSaving.set(true);

    const data: any = {
      designation: this.form.value.designation,
      productionHouse: this.form.value.productionHouse,
      industryType: this.form.value.industryType,
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
