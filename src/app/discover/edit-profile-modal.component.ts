import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from '@angular/fire/storage';
import {
  Profile,
  Education,
  Work,
} from '../../assets/interfaces/profile.interfaces';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen) {
    <!-- Modal backdrop -->
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal content -->
      <div
        class="bg-neutral-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden ring-1 ring-white/10 shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-neutral-800 flex items-center justify-between"
        >
          <h2 class="text-xl font-semibold text-white">Edit Profile</h2>
          <button
            (click)="closeModal()"
            class="p-2 hover:bg-white/5 rounded-lg transition-colors"
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

        <!-- Form content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <!-- Common Fields -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">
                Basic Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Gender</label
                  >
                  <select
                    formControlName="gender"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Location</label
                  >
                  <input
                    type="text"
                    formControlName="location"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Age</label
                  >
                  <input
                    type="text"
                    formControlName="age"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter age"
                  />
                </div>
              </div>
            </div>

            <!-- Actor Profile Fields -->
            @if (isActor) {
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">
                Actor Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Stage Name *</label
                  >
                  <input
                    type="text"
                    formControlName="stageName"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter stage name"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Height</label
                  >
                  <input
                    type="text"
                    formControlName="height"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5'8"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Weight</label
                  >
                  <input
                    type="text"
                    formControlName="weight"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 70kg"
                  />
                </div>
              </div>
            </div>

            <!-- Voice Intro Upload -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">
                Voice Introduction
              </h3>
              <div class="space-y-4">
                @if (currentVoiceIntro()) {
                <div
                  class="flex items-center gap-4 p-4 bg-neutral-800 rounded-lg"
                >
                  <audio controls class="flex-1">
                    <source [src]="currentVoiceIntro()" type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <button
                    type="button"
                    (click)="removeVoiceIntro()"
                    class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
                }

                <div class="relative">
                  <input
                    type="file"
                    (change)="onVoiceIntroSelect($event)"
                    accept="audio/*"
                    class="hidden"
                    #voiceInput
                  />
                  <button
                    type="button"
                    (click)="voiceInput.click()"
                    class="w-full p-4 border-2 border-dashed border-neutral-600 rounded-lg hover:border-neutral-500 transition-colors text-neutral-300"
                  >
                    <div class="text-center">
                      <svg
                        class="w-8 h-8 mx-auto mb-2 text-neutral-400"
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
                      <p class="text-sm">
                        {{
                          currentVoiceIntro()
                            ? 'Replace voice intro'
                            : 'Upload voice introduction'
                        }}
                      </p>
                    </div>
                  </button>
                </div>

                @if (voiceUploadProgress() > 0 && voiceUploadProgress() < 100) {
                <div class="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    [style.width.%]="voiceUploadProgress()"
                  ></div>
                </div>
                }
              </div>
            </div>

            <!-- Skills -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">Skills</h3>
              <div class="space-y-2">
                <div formArrayName="skills">
                  @for (skill of skillsArray.controls; track $index) {
                  <div class="flex gap-2">
                    <input
                      type="text"
                      [formControlName]="$index"
                      class="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter skill"
                    />
                    <button
                      type="button"
                      (click)="removeSkill($index)"
                      class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  }
                </div>
                <button
                  type="button"
                  (click)="addSkill()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Skill
                </button>
              </div>
            </div>

            <!-- Languages -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">Languages</h3>
              <div class="space-y-2">
                <div formArrayName="languages">
                  @for (language of languagesArray.controls; track $index) {
                  <div class="flex gap-2">
                    <input
                      type="text"
                      [formControlName]="$index"
                      class="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter language"
                    />
                    <button
                      type="button"
                      (click)="removeLanguage($index)"
                      class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  }
                </div>
                <button
                  type="button"
                  (click)="addLanguage()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Language
                </button>
              </div>
            </div>

            <!-- Education -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">Education</h3>
              <div class="space-y-4">
                <div formArrayName="education">
                  @for (edu of educationArray.controls; track $index) {
                  <div class="p-4 bg-neutral-800 rounded-lg">
                    <div
                      [formGroupName]="$index"
                      class="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Year Completed</label
                        >
                        <input
                          type="text"
                          formControlName="yearCompleted"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 2020"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >School Name</label
                        >
                        <input
                          type="text"
                          formControlName="schoolName"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="School/University name"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Course Name</label
                        >
                        <input
                          type="text"
                          formControlName="courseName"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Course/Degree name"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      (click)="removeEducation($index)"
                      class="mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Remove Education
                    </button>
                  </div>
                  }
                </div>
                <button
                  type="button"
                  (click)="addEducation()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Education
                </button>
              </div>
            </div>

            <!-- Work Experience -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">
                Work Experience
              </h3>
              <div class="space-y-4">
                <div formArrayName="actorWorks">
                  @for (work of actorWorksArray.controls; track $index) {
                  <div class="p-4 bg-neutral-800 rounded-lg">
                    <div
                      [formGroupName]="$index"
                      class="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Year</label
                        >
                        <input
                          type="text"
                          formControlName="year"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 2023"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Project Name</label
                        >
                        <input
                          type="text"
                          formControlName="projectName"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Project/Movie name"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Genre</label
                        >
                        <input
                          type="text"
                          formControlName="genre"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Drama, Action"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      (click)="removeActorWork($index)"
                      class="mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Remove Work
                    </button>
                  </div>
                  }
                </div>
                <button
                  type="button"
                  (click)="addActorWork()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Work Experience
                </button>
              </div>
            </div>
            }

            <!-- Producer Profile Fields -->
            @if (!isActor) {
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">
                Producer Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Name *</label
                  >
                  <input
                    type="text"
                    formControlName="name"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Designation</label
                  >
                  <input
                    type="text"
                    formControlName="designation"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Director, Producer"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Production House</label
                  >
                  <input
                    type="text"
                    formControlName="productionHouse"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Production house name"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Industry Type</label
                  >
                  <select
                    formControlName="industryType"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">select industry</option>
                    <option value="Film">film</option>
                    <option value="Television">television</option>
                    <option value="Web Series">web series</option>
                    <option value="Theater">theater</option>
                    <option value="Advertisement">advertisement</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Producer Work Experience -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">
                Work Experience
              </h3>
              <div class="space-y-4">
                <div formArrayName="producerWorks">
                  @for (work of producerWorksArray.controls; track $index) {
                  <div class="p-4 bg-neutral-800 rounded-lg">
                    <div
                      [formGroupName]="$index"
                      class="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Year</label
                        >
                        <input
                          type="text"
                          formControlName="year"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 2023"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Project Name</label
                        >
                        <input
                          type="text"
                          formControlName="projectName"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Project/Movie name"
                        />
                      </div>
                      <div>
                        <label
                          class="block text-sm font-medium text-neutral-300 mb-2"
                          >Genre</label
                        >
                        <input
                          type="text"
                          formControlName="genre"
                          class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Drama, Action"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      (click)="removeProducerWork($index)"
                      class="mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Remove Work
                    </button>
                  </div>
                  }
                </div>
                <button
                  type="button"
                  (click)="addProducerWork()"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Work Experience
                </button>
              </div>
            </div>
            }

            <!-- Social Links -->
            <div class="mb-8">
              <h3 class="text-lg font-medium text-white mb-4">Social Links</h3>
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
                formGroupName="social"
              >
                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Instagram URL</label
                  >
                  <input
                    type="url"
                    formControlName="instaIdUrl"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [class.border-red-500]="profileForm.get('social.instaIdUrl')?.invalid && profileForm.get('social.instaIdUrl')?.touched"
                    placeholder="https://instagram.com/username"
                  />
                  @if (profileForm.get('social.instaIdUrl')?.invalid && profileForm.get('social.instaIdUrl')?.touched) {
                    <div class="mt-1 text-sm text-red-400">
                      @if (profileForm.get('social.instaIdUrl')?.errors?.['invalidUrl']) {
                        Please enter a valid URL
                      }
                      @if (profileForm.get('social.instaIdUrl')?.errors?.['mustEndWithCom']) {
                        URL must end with .com
                      }
                      @if (profileForm.get('social.instaIdUrl')?.errors?.['notInstagramUrl']) {
                        Must be a valid Instagram URL
                      }
                    </div>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >YouTube URL</label
                  >
                  <input
                    type="url"
                    formControlName="youtubeIdUrl"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [class.border-red-500]="profileForm.get('social.youtubeIdUrl')?.invalid && profileForm.get('social.youtubeIdUrl')?.touched"
                    placeholder="https://youtube.com/channel/..."
                  />
                  @if (profileForm.get('social.youtubeIdUrl')?.invalid && profileForm.get('social.youtubeIdUrl')?.touched) {
                    <div class="mt-1 text-sm text-red-400">
                      @if (profileForm.get('social.youtubeIdUrl')?.errors?.['invalidUrl']) {
                        Please enter a valid URL
                      }
                      @if (profileForm.get('social.youtubeIdUrl')?.errors?.['mustEndWithCom']) {
                        URL must end with .com
                      }
                      @if (profileForm.get('social.youtubeIdUrl')?.errors?.['notYoutubeUrl']) {
                        Must be a valid YouTube URL
                      }
                    </div>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >External Link</label
                  >
                  <input
                    type="url"
                    formControlName="externalLinkUrl"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [class.border-red-500]="profileForm.get('social.externalLinkUrl')?.invalid && profileForm.get('social.externalLinkUrl')?.touched"
                    placeholder="https://yourwebsite.com"
                  />
                  @if (profileForm.get('social.externalLinkUrl')?.invalid && profileForm.get('social.externalLinkUrl')?.touched) {
                    <div class="mt-1 text-sm text-red-400">
                      @if (profileForm.get('social.externalLinkUrl')?.errors?.['invalidUrl']) {
                        Please enter a valid URL
                      }
                      @if (profileForm.get('social.externalLinkUrl')?.errors?.['mustEndWithCom']) {
                        URL must end with .com
                      }
                    </div>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-300 mb-2"
                    >Additional Link</label
                  >
                  <input
                    type="url"
                    formControlName="addLinkUrl"
                    class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [class.border-red-500]="profileForm.get('social.addLinkUrl')?.invalid && profileForm.get('social.addLinkUrl')?.touched"
                    placeholder="https://additional-link.com"
                  />
                  @if (profileForm.get('social.addLinkUrl')?.invalid && profileForm.get('social.addLinkUrl')?.touched) {
                    <div class="mt-1 text-sm text-red-400">
                      @if (profileForm.get('social.addLinkUrl')?.errors?.['invalidUrl']) {
                        Please enter a valid URL
                      }
                      @if (profileForm.get('social.addLinkUrl')?.errors?.['mustEndWithCom']) {
                        URL must end with .com
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-neutral-800 flex justify-end gap-3"
        >
          <button
            type="button"
            (click)="closeModal()"
            class="px-4 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            (click)="onSubmit()"
            [disabled]="profileForm.invalid || isSaving()"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class EditProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() profile: Profile | null = null;
  @Input() isActor = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Profile>();

  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  profileForm!: FormGroup;
  isSaving = signal(false);
  currentVoiceIntro = signal<string | null>(null);
  voiceUploadProgress = signal(0);

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Populate form when profile data changes or modal opens
    if ((changes['profile'] && this.profile) || (changes['isOpen'] && this.isOpen && this.profile)) {
      this.populateForm();
    }
    
    // Re-initialize form if isActor changes to update validators
    if (changes['isActor'] && this.profileForm) {
      this.initializeForm();
      if (this.profile) {
        this.populateForm();
      }
    }
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      gender: [''],
      location: [''],
      age: [''],

      // Actor fields
      stageName: ['', this.isActor ? [Validators.required] : []],
      height: [''],
      weight: [''],
      skills: this.fb.array([]),
      languages: this.fb.array([]),
      education: this.fb.array([]),
      actorWorks: this.fb.array([]),

      // Producer fields
      name: ['', !this.isActor ? [Validators.required] : []],
      designation: [''],
      productionHouse: [''],
      industryType: [''],
      producerWorks: this.fb.array([]),

      // Social fields
      social: this.fb.group({
        instaIdUrl: ['', [this.instagramValidator.bind(this)]],
        youtubeIdUrl: ['', [this.youtubeValidator.bind(this)]],
        externalLinkUrl: ['', [this.urlValidator.bind(this)]],
        addLinkUrl: ['', [this.urlValidator.bind(this)]],
      }),
    });
  }

  populateForm() {
    if (!this.profile) return;

    // Common fields
    this.profileForm.patchValue({
      gender: this.profile.gender || '',
      location: this.profile.location || '',
      age: this.profile.age || '',
      social: {
        instaIdUrl: this.profile.social?.instaIdUrl || '',
        youtubeIdUrl: this.profile.social?.youtubeIdUrl || '',
        externalLinkUrl: this.profile.social?.externalLinkUrl || '',
        addLinkUrl: this.profile.social?.addLinkUrl || '',
      },
    });

    if (this.isActor && this.profile.actorProfile) {
      const actor = this.profile.actorProfile;

      this.profileForm.patchValue({
        stageName: actor.stageName,
        height: actor.height || '',
        weight: actor.weight || '',
      });

      // Check for voice intro in database first, then in storage if not found
      if (actor.voiceIntro) {
        this.currentVoiceIntro.set(actor.voiceIntro);
      } else {
        this.checkForExistingVoiceIntro();
      }

      // Populate arrays (ensure at least one empty field if none exist)
      const skills = actor.skills || [];
      const skillStrings = skills.map(skill => typeof skill === 'string' ? skill : skill.skill);
      this.populateSkills(skillStrings.length > 0 ? skillStrings : ['']);
      
      const languages = actor.languages || [];
      const languageStrings = languages.map(lang => typeof lang === 'string' ? lang : lang.language);
      this.populateLanguages(languageStrings.length > 0 ? languageStrings : ['']);
      
      const education = actor.listEducation || [];
      this.populateEducation(education.length > 0 ? education : [{ yearCompleted: '', schoolName: '', courseName: '', certificateUrl: '' }]);
      
      const works = actor.actorWorks || [];
      this.populateActorWorks(works.length > 0 ? works : [{ year: '', projectName: '', genre: '' }]);
    }

    if (!this.isActor && this.profile.producerProfile) {
      const producer = this.profile.producerProfile;

      this.profileForm.patchValue({
        name: producer.name,
        designation: producer.designation || '',
        productionHouse: producer.productionHouse || '',
        industryType: producer.industryType || '',
      });

      const producerWorks = producer.producerWorks || [];
      this.populateProducerWorks(producerWorks.length > 0 ? producerWorks : [{ year: '', projectName: '', genre: '' }]);
    }
  }

  // Array getters
  get skillsArray() {
    return this.profileForm.get('skills') as FormArray;
  }
  get languagesArray() {
    return this.profileForm.get('languages') as FormArray;
  }
  get educationArray() {
    return this.profileForm.get('education') as FormArray;
  }
  get actorWorksArray() {
    return this.profileForm.get('actorWorks') as FormArray;
  }
  get producerWorksArray() {
    return this.profileForm.get('producerWorks') as FormArray;
  }

  // Array population methods
  populateSkills(skills: string[]) {
    const skillsArray = this.skillsArray;
    skillsArray.clear();
    skills.forEach((skill) => {
      skillsArray.push(this.fb.control(skill));
    });
  }

  populateLanguages(languages: string[]) {
    const languagesArray = this.languagesArray;
    languagesArray.clear();
    languages.forEach((language) => {
      languagesArray.push(this.fb.control(language));
    });
  }

  populateEducation(education: Education[]) {
    const educationArray = this.educationArray;
    educationArray.clear();
    education.forEach((edu) => {
      educationArray.push(
        this.fb.group({
          yearCompleted: [edu.yearCompleted],
          schoolName: [edu.schoolName],
          courseName: [edu.courseName],
          certificateUrl: [edu.certificateUrl || ''],
        })
      );
    });
  }

  populateActorWorks(works: Work[]) {
    const worksArray = this.actorWorksArray;
    worksArray.clear();
    works.forEach((work) => {
      worksArray.push(
        this.fb.group({
          year: [work.year],
          projectName: [work.projectName],
          genre: [work.genre || ''],
        })
      );
    });
  }

  populateProducerWorks(works: Work[]) {
    const worksArray = this.producerWorksArray;
    worksArray.clear();
    works.forEach((work) => {
      worksArray.push(
        this.fb.group({
          year: [work.year],
          projectName: [work.projectName],
          genre: [work.genre || ''],
        })
      );
    });
  }

  // Array manipulation methods
  addSkill() {
    this.skillsArray.push(this.fb.control(''));
  }

  removeSkill(index: number) {
    this.skillsArray.removeAt(index);
  }

  addLanguage() {
    this.languagesArray.push(this.fb.control(''));
  }

  removeLanguage(index: number) {
    this.languagesArray.removeAt(index);
  }

  addEducation() {
    this.educationArray.push(
      this.fb.group({
        yearCompleted: [''],
        schoolName: [''],
        courseName: [''],
        certificateUrl: [''],
      })
    );
  }

  removeEducation(index: number) {
    this.educationArray.removeAt(index);
  }

  addActorWork() {
    this.actorWorksArray.push(
      this.fb.group({
        year: [''],
        projectName: [''],
        genre: [''],
      })
    );
  }

  removeActorWork(index: number) {
    this.actorWorksArray.removeAt(index);
  }

  addProducerWork() {
    this.producerWorksArray.push(
      this.fb.group({
        year: [''],
        projectName: [''],
        genre: [''],
      })
    );
  }

  removeProducerWork(index: number) {
    this.producerWorksArray.removeAt(index);
  }

  // Voice intro methods
  async onVoiceIntroSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert('Audio file must be less than 10MB');
      return;
    }

    try {
      this.voiceUploadProgress.set(0);

      // Upload to Firebase Storage in users/:userid/voice directory
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `users/${this.profile?.uid}/voice/voice_intro_${timestamp}.${fileExtension}`;
      const storageRef = ref(this.storage, fileName);

      this.voiceUploadProgress.set(50); // Show progress
      const uploadTask = uploadBytes(storageRef, file);

      uploadTask.then(async (snapshot) => {
        this.voiceUploadProgress.set(90);
        const downloadURL = await getDownloadURL(snapshot.ref);
        this.currentVoiceIntro.set(downloadURL);
        this.voiceUploadProgress.set(100);
        
        // Reset progress after a short delay
        setTimeout(() => {
          this.voiceUploadProgress.set(0);
        }, 1000);
      }).catch((error) => {
        console.error('Upload failed:', error);
        this.voiceUploadProgress.set(0);
        alert('Failed to upload voice intro. Please try again.');
      });
    } catch (error) {
      console.error('Upload initialization failed:', error);
      this.voiceUploadProgress.set(0);
      alert('Failed to upload voice intro. Please try again.');
    }
  }

  removeVoiceIntro() {
    this.currentVoiceIntro.set(null);
  }

  // Check for existing voice intro in storage directory
  async checkForExistingVoiceIntro() {
    if (!this.profile?.uid) return;

    try {
      const voiceStorageRef = ref(this.storage, `users/${this.profile.uid}/voice`);
      const voiceFiles = await listAll(voiceStorageRef);
      
      if (voiceFiles.items.length > 0) {
        // Get the most recent voice file (assuming timestamp naming)
        const sortedFiles = voiceFiles.items.sort((a, b) => b.name.localeCompare(a.name));
        const latestVoiceFile = sortedFiles[0];
        
        const downloadURL = await getDownloadURL(latestVoiceFile);
        this.currentVoiceIntro.set(downloadURL);
      }
    } catch (error) {
      // No voice directory or files exist, which is fine
      this.currentVoiceIntro.set(null);
    }
  }

  // Helper method to clean undefined values from objects
  // Custom validators
  private urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const urlPattern = /^https?:\/\/(www\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\/.*)?$/;
    
    if (!urlPattern.test(control.value)) {
      return { invalidUrl: true };
    }
    
    if (!control.value.endsWith('.com') && !control.value.includes('.com/')) {
      return { mustEndWithCom: true };
    }
    
    return null;
  }

  private instagramValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const urlError = this.urlValidator(control);
    if (urlError) return urlError;
    
    if (!control.value.includes('instagram.com') && !control.value.includes('instagr.am')) {
      return { notInstagramUrl: true };
    }
    
    return null;
  }

  private youtubeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const urlError = this.urlValidator(control);
    if (urlError) return urlError;
    
    if (!control.value.includes('youtube.com') && !control.value.includes('youtu.be')) {
      return { notYoutubeUrl: true };
    }
    
    return null;
  }

  // Helper method to clean undefined values from objects
  private cleanObject(obj: any): any {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          const cleanedNested = this.cleanObject(obj[key]);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = obj[key];
        }
      }
    }
    return cleaned;
  }

  // Modal methods
  closeModal() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  async onSubmit() {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);

    try {
      const formValue = this.profileForm.value;

      // Build updated profile (without undefined values)
      const profileData: any = {
        uid: this.profile?.uid || '',
        gender: formValue.gender,
        location: formValue.location,
        age: formValue.age,
        social: {
          instaIdUrl: formValue.social.instaIdUrl,
          youtubeIdUrl: formValue.social.youtubeIdUrl,
          externalLinkUrl: formValue.social.externalLinkUrl,
          addLinkUrl: formValue.social.addLinkUrl,
        },
      };

      const updatedProfile: Profile = this.cleanObject(profileData) as Profile;

      if (this.isActor) {
        const actorData = {
          stageName: formValue.stageName,
          height: formValue.height,
          weight: formValue.weight,
          voiceIntro: this.currentVoiceIntro(),
          skills: formValue.skills.filter((skill: string) => skill.trim()).map((skill: string) => ({ skill, rating: 3 })),
          languages: formValue.languages.filter((lang: string) => lang.trim()).map((lang: string) => ({ language: lang, rating: 3 })),
          listEducation: formValue.education.filter(
            (edu: any) => edu.yearCompleted && edu.schoolName && edu.courseName
          ),
          actorWorks: formValue.actorWorks.filter(
            (work: any) => work.year && work.projectName
          ),
          // Preserve existing fields
          carouselImagesUrl:
            this.profile?.actorProfile?.carouselImagesUrl || [],
          notifications: this.profile?.actorProfile?.notifications || [],
          actorAnalytics: this.profile?.actorProfile?.actorAnalytics || [],
          profileViewCount: this.profile?.actorProfile?.profileViewCount || 0,
          wishListCount: this.profile?.actorProfile?.wishListCount || 0,
          isSubscribed: this.profile?.actorProfile?.isSubscribed || false,
          actorProfileImageUrl:
            this.profile?.actorProfile?.actorProfileImageUrl,
        };
        
        updatedProfile.actorProfile = this.cleanObject(actorData);
      } else {
        const producerData = {
          name: formValue.name,
          designation: formValue.designation,
          productionHouse: formValue.productionHouse,
          industryType: formValue.industryType,
          producerWorks: formValue.producerWorks.filter(
            (work: any) => work.year && work.projectName
          ),
          // Preserve existing fields
          notifications: this.profile?.producerProfile?.notifications || [],
          isSubscribed: this.profile?.producerProfile?.isSubscribed || false,
          isBadgedVerified:
            this.profile?.producerProfile?.isBadgedVerified || false,
          wishList: this.profile?.producerProfile?.wishList || [],
          producerProfileImageUrl:
            this.profile?.producerProfile?.producerProfileImageUrl,
        };
        
        updatedProfile.producerProfile = this.cleanObject(producerData);
      }

      // Save to Firestore
      console.log('Saving cleaned profile data:', updatedProfile);
      const profileRef = doc(this.firestore, 'profiles', updatedProfile.uid);
      await updateDoc(profileRef, updatedProfile as any);

      this.save.emit(updatedProfile);
      this.closeModal();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
