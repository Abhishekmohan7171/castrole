import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
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
          <div class="w-40 h-40 rounded-full overflow-hidden bg-neutral-800 ring-4 ring-neutral-700 transition-all duration-300 group-hover:ring-purple-500/50">
            @if (profileImageUrl()) {
              <img 
                [src]="profileImageUrl()" 
                alt="Profile" 
                class="w-full h-full object-cover"
              />
            } @else {
              <div class="w-full h-full flex items-center justify-center">
                <svg class="w-16 h-16 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
              <svg class="w-8 h-8 text-white mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
          <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
            {{ isActor ? 'stage name' : 'name' }}
          </label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <input
              type="text"
              [formControlName]="isActor ? 'stageName' : 'name'"
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              [placeholder]="isActor ? 'lil rahul nair' : 'enter name'"
            />
          </div>
        </div>

        @if (isActor) {
          <!-- Height and Weight Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Height -->
            <div>
              <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">height</label>
              <div class="relative">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <input
                  type="text"
                  formControlName="height"
                  class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="180cm"
                />
              </div>
            </div>

            <!-- Weight -->
            <div>
              <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">weight</label>
              <div class="relative">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <input
                  type="text"
                  formControlName="weight"
                  class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="85kg"
                />
              </div>
            </div>
          </div>
        }

        <!-- Age and Gender Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Age -->
          <div>
            <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">age</label>
            <div class="relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <input
                type="number"
                formControlName="age"
                min="1"
                max="120"
                class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="25"
              />
            </div>
          </div>

          <!-- Gender -->
          <div>
            <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">gender</label>
            <div class="relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <select
                formControlName="gender"
                class="w-full pl-12 pr-10 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg appearance-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer"
              >
                <option value="" disabled class="bg-neutral-900 text-neutral-500">Select gender</option>
                <option value="male" class="bg-neutral-900 text-white">male</option>
                <option value="female" class="bg-neutral-900 text-white">female</option>
                <option value="non-binary" class="bg-neutral-900 text-white">non-binary</option>
                <option value="prefer-not-to-say" class="bg-neutral-900 text-white">prefer not to say</option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div>
          <label class="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">location</label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <input
              type="text"
              formControlName="location"
              class="w-full pl-12 pr-4 py-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-white text-lg placeholder-neutral-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="ernakulam"
            />
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end pt-4">
          <button
            type="button"
            (click)="onSave()"
            [disabled]="form.invalid || isSaving()"
            class="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 text-base"
          >
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: ``
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

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  initializeForm() {
    if (this.isActor) {
      this.form = this.fb.group({
        stageName: ['', Validators.required],
        height: [''],
        weight: [''],
        age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
        gender: ['', Validators.required],
        location: ['', Validators.required]
      });
    } else {
      this.form = this.fb.group({
        name: ['', Validators.required],
        age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
        gender: ['', Validators.required],
        location: ['', Validators.required]
      });
    }
  }

  populateForm() {
    if (!this.profile) return;

    if (this.isActor && this.profile.actorProfile) {
      this.form.patchValue({
        stageName: this.profile.actorProfile.stageName || '',
        height: this.profile.actorProfile.height || '',
        weight: this.profile.actorProfile.weight || '',
        age: this.profile.age || '',
        gender: this.profile.gender || '',
        location: this.profile.location || ''
      });
      this.profileImageUrl.set(this.profile.actorProfile.actorProfileImageUrl || null);
    } else if (this.profile.producerProfile) {
      this.form.patchValue({
        name: this.profile.producerProfile.name || '',
        age: this.profile.age || '',
        gender: this.profile.gender || '',
        location: this.profile.location || ''
      });
      this.profileImageUrl.set(this.profile.producerProfile.producerProfileImageUrl || null);
    }
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
      
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `profile-images/${this.profile?.uid}/${timestamp}.jpg`;
      const storageRef = ref(this.storage, fileName);
      
      await uploadBytes(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      this.profileImageUrl.set(downloadURL);
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
      age: formValue.age,
      gender: formValue.gender,
      location: formValue.location,
      profileImageUrl: this.profileImageUrl()
    };

    if (this.isActor) {
      data.stageName = formValue.stageName;
      data.height = formValue.height;
      data.weight = formValue.weight;
    } else {
      data.name = formValue.name;
    }

    this.save.emit(data);

    setTimeout(() => this.isSaving.set(false), 1000);
  }
}
