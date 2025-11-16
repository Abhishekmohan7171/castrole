import { Component, Output, EventEmitter, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-account-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" (click)="onBackdropClick($event)">
      <div class="bg-neutral-900 ring-2 ring-white/10 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">
              Add {{ accountType === 'actor' ? 'Actor' : 'Producer' }} Account
            </h2>
            <button
              type="button"
              (click)="onClose()"
              class="text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-sm text-neutral-400 mt-1">
            Complete your {{ accountType }} profile to get started
          </p>
        </div>

        <!-- Form -->
        <form [formGroup]="addAccountForm" (ngSubmit)="onSubmit()" class="p-6 space-y-5">
          <!-- Stage Name / Production House -->
          @if (accountType === 'actor') {
            <div>
              <label class="block text-sm font-medium text-neutral-300 mb-1">
                Stage Name <span class="text-red-400">*</span>
              </label>
              <input
                type="text"
                formControlName="name"
                placeholder="Enter your stage name"
                class="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                [class.border-red-500]="addAccountForm.get('name')?.invalid && addAccountForm.get('name')?.touched"
              />
              @if (addAccountForm.get('name')?.invalid && addAccountForm.get('name')?.touched) {
                <p class="text-xs text-red-400 mt-1">Stage name must be at least 2 characters</p>
              }
            </div>
          } @else {
            <div>
              <label class="block text-sm font-medium text-neutral-300 mb-1">
                Production House <span class="text-red-400">*</span>
              </label>
              <input
                type="text"
                formControlName="productionHouse"
                placeholder="Enter production house name"
                class="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                [class.border-red-500]="addAccountForm.get('productionHouse')?.invalid && addAccountForm.get('productionHouse')?.touched"
              />
              @if (addAccountForm.get('productionHouse')?.invalid && addAccountForm.get('productionHouse')?.touched) {
                <p class="text-xs text-red-400 mt-1">Production house name must be at least 2 characters</p>
              }
            </div>
          }

          <!-- Location -->
          <div class="relative">
            <label class="block text-sm font-medium text-neutral-300 mb-1">
              Location <span class="text-red-400">*</span>
            </label>
            <input
              type="text"
              formControlName="location"
              (input)="onLocationInput($event)"
              (focus)="showLocationSuggestions = true"
              placeholder="Enter your location"
              class="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              [class.border-red-500]="addAccountForm.get('location')?.invalid && addAccountForm.get('location')?.touched"
            />

            <!-- Location Suggestions Dropdown -->
            @if (showLocationSuggestions && filteredLocations().length > 0) {
              <div class="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                @for (location of filteredLocations(); track location) {
                  <button
                    type="button"
                    (click)="selectLocation(location)"
                    class="w-full text-left px-4 py-2 hover:bg-neutral-700 transition-colors text-sm text-neutral-200"
                  >
                    {{ location }}
                  </button>
                }
              </div>
            }

            @if (addAccountForm.get('location')?.invalid && addAccountForm.get('location')?.touched) {
              <p class="text-xs text-red-400 mt-1">Location is required</p>
            }
          </div>

          <!-- Email (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-neutral-300 mb-1">
              Email
            </label>
            <input
              type="email"
              formControlName="email"
              readonly
              class="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-400 cursor-not-allowed"
            />
            <p class="text-xs text-neutral-500 mt-1">Using your existing verified email</p>
          </div>

          <!-- Phone (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-neutral-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              formControlName="phone"
              readonly
              class="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-400 cursor-not-allowed"
            />
            <p class="text-xs text-neutral-500 mt-1">Using your existing verified phone</p>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
              <p class="text-sm text-red-400">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              (click)="onClose()"
              [disabled]="isSubmitting()"
              class="flex-1 px-4 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="addAccountForm.invalid || isSubmitting()"
              class="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              @if (isSubmitting()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              } @else {
                Add Account
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AddAccountModalComponent {
  @Input() accountType!: 'actor' | 'producer';
  @Input() email!: string;
  @Input() phone!: string;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{
    name?: string;
    productionHouse?: string;
    location: string;
  }>();

  addAccountForm!: FormGroup;
  showLocationSuggestions = false;
  filteredLocations = signal<string[]>([]);
  allLocations: string[] = [];
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(private fb: FormBuilder) {
    this.initializeForm();
    this.loadLocations();
  }

  private initializeForm(): void {
    this.addAccountForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      productionHouse: ['', [Validators.required, Validators.minLength(2)]],
      location: ['', Validators.required],
      email: [{ value: this.email, disabled: true }],
      phone: [{ value: this.phone, disabled: true }]
    });

    // Remove validators for fields not needed based on account type
    effect(() => {
      if (this.accountType === 'actor') {
        this.addAccountForm.get('productionHouse')?.clearValidators();
        this.addAccountForm.get('productionHouse')?.updateValueAndValidity();
      } else {
        this.addAccountForm.get('name')?.clearValidators();
        this.addAccountForm.get('name')?.updateValueAndValidity();
      }
    });
  }

  private async loadLocations(): Promise<void> {
    try {
      const response = await fetch('/assets/json/processed-locations.json');
      const data = await response.json();
      this.allLocations = data.locations || [];
    } catch (error) {
      console.error('Error loading locations:', error);
      this.allLocations = [];
    }
  }

  onLocationInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input.length < 2) {
      this.filteredLocations.set([]);
      return;
    }

    const filtered = this.allLocations.filter(location =>
      location.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 10);

    this.filteredLocations.set(filtered);
  }

  selectLocation(location: string): void {
    this.addAccountForm.patchValue({ location });
    this.showLocationSuggestions = false;
    this.filteredLocations.set([]);
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }

  onSubmit(): void {
    if (this.addAccountForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.addAccountForm.getRawValue();

    if (this.accountType === 'actor') {
      this.submit.emit({
        name: formValue.name,
        location: formValue.location
      });
    } else {
      this.submit.emit({
        productionHouse: formValue.productionHouse,
        location: formValue.location
      });
    }
  }

  setError(message: string): void {
    this.errorMessage.set(message);
    this.isSubmitting.set(false);
  }

  resetSubmitting(): void {
    this.isSubmitting.set(false);
  }
}
