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
          
          <!-- Edit Overlay -->
          <button
            type="button"
            (click)="imageInput.click()"
            class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            [disabled]="isUploading()"
          >
            @if (isUploading()) {
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            } @else {
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            }
          </button>
          
          <input
            #imageInput
            type="file"
            accept="image/*"
            (change)="onImageSelect($event)"
            class="hidden"
          />
        </div>
        <p class="text-sm text-neutral-400 mt-3">Click to upload profile image</p>
      </div>

      <!-- Form Fields -->
      <form [formGroup]="form" class="space-y-6">
        <!-- Stage Name / Name -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-neutral-300">
            {{ isActor ? 'stage name' : 'name' }}
            @if (isActor) {
              <span class="text-red-400 ml-1">*</span>
            }
          </label>
          <div class="relative">
            <input
              type="text"
              [formControlName]="isActor ? 'stageName' : 'name'"
              [placeholder]="isActor ? 'enter stage name' : 'enter name'"
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
          @if (form.get(isActor ? 'stageName' : 'name')?.invalid && form.get(isActor ? 'stageName' : 'name')?.touched) {
            <p class="text-xs text-red-400">This field is required</p>
          }
        </div>

        <!-- Two Column Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Height -->
          @if (isActor) {
            <div class="space-y-2">
              <label class="block text-sm font-medium text-neutral-300">height</label>
              <div class="relative">
                <input
                  type="text"
                  formControlName="height"
                  placeholder="160cm"
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

            <!-- Weight -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-neutral-300">weight</label>
              <div class="relative">
                <input
                  type="text"
                  formControlName="weight"
                  placeholder="60kg"
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
          }

          <!-- Age -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-300">age</label>
            <div class="relative">
              <input
                type="text"
                formControlName="age"
                placeholder="25"
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

          <!-- Gender -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-300">gender</label>
            <div class="relative">
              <select
                formControlName="gender"
                class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">select gender</option>
                <option value="Male">male</option>
                <option value="Female">female</option>
                <option value="Other">other</option>
              </select>
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Location (Full Width) -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-neutral-300">location</label>
          <div class="relative">
            <input
              type="text"
              formControlName="location"
              placeholder="Chennai, Tamil Nadu"
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

        <!-- Save Button -->
        <div class="flex justify-end pt-4">
          <button
            type="button"
            (click)="onSave()"
            [disabled]="form.invalid || isSaving()"
            class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
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
  @Input() isActor = false;
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
        age: [''],
        gender: [''],
        location: ['']
      });
    } else {
      this.form = this.fb.group({
        name: ['', Validators.required],
        age: [''],
        gender: [''],
        location: ['']
      });
    }
  }

  populateForm() {
    if (!this.profile) return;

    // Set profile image
    if (this.isActor && this.profile.actorProfile?.actorProfileImageUrl) {
      this.profileImageUrl.set(this.profile.actorProfile.actorProfileImageUrl);
    } else if (!this.isActor && this.profile.producerProfile?.producerProfileImageUrl) {
      this.profileImageUrl.set(this.profile.producerProfile.producerProfileImageUrl);
    }

    // Populate common fields
    this.form.patchValue({
      age: this.profile.age || '',
      gender: this.profile.gender || '',
      location: this.profile.location || ''
    });

    // Populate role-specific fields
    if (this.isActor && this.profile.actorProfile) {
      this.form.patchValue({
        stageName: this.profile.actorProfile.stageName || '',
        height: this.profile.actorProfile.height || '',
        weight: this.profile.actorProfile.weight || ''
      });
    } else if (!this.isActor && this.profile.producerProfile) {
      this.form.patchValue({
        name: this.profile.producerProfile.name || ''
      });
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
      alert('Image size must be less than 5MB');
      return;
    }

    this.isUploading.set(true);

    try {
      // Compress image
      const compressedFile = await this.compressImage(file);
      
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `profile-images/${this.profile?.uid}/${timestamp}.jpg`;
      const storageRef = ref(this.storage, fileName);
      
      await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      this.profileImageUrl.set(downloadURL);
      
      // Emit change
      this.save.emit({
        ...this.form.value,
        profileImageUrl: downloadURL
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      this.isUploading.set(false);
    }
  }

  private compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Target size: 800x800 max
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
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
            0.85
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

    const formData = {
      ...this.form.value,
      profileImageUrl: this.profileImageUrl()
    };

    this.save.emit(formData);

    // Reset saving state after a delay (parent should handle this)
    setTimeout(() => this.isSaving.set(false), 1000);
  }
}
