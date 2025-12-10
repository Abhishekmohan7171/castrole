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
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  Profile,
  Social,
} from '../../../../assets/interfaces/profile.interfaces';

@Component({
  selector: 'app-socials-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <form [formGroup]="form" class="space-y-6">
        <!-- Instagram -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-neutral-300"
            >instagram</label
          >
          <div class="relative">
            <input
              type="url"
              formControlName="instaIdUrl"
              placeholder="www.instagram.com"
              class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              (blur)="onFieldBlur()"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg
                class="w-4 h-4 text-neutral-400"
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
            </button>
          </div>
          @if (form.get('instaIdUrl')?.invalid &&
          form.get('instaIdUrl')?.touched) {
          <p class="text-xs text-red-400">
            @if (form.get('instaIdUrl')?.errors?.['notInstagramUrl']) { Please
            enter a valid Instagram URL } @else { Please enter a valid URL }
          </p>
          }
        </div>

        <!-- YouTube -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-neutral-300"
            >youtube</label
          >
          <div class="relative">
            <input
              type="url"
              formControlName="youtubeIdUrl"
              placeholder="www.youtube.com"
              class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              (blur)="onFieldBlur()"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg
                class="w-4 h-4 text-neutral-400"
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
            </button>
          </div>
          @if (form.get('youtubeIdUrl')?.invalid &&
          form.get('youtubeIdUrl')?.touched) {
          <p class="text-xs text-red-400">
            @if (form.get('youtubeIdUrl')?.errors?.['notYoutubeUrl']) { Please
            enter a valid YouTube URL } @else { Please enter a valid URL }
          </p>
          }
        </div>

        <!-- External Links -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-neutral-300"
            >external links</label
          >
          <div class="relative">
            <input
              type="url"
              formControlName="externalLinkUrl"
              placeholder="www.otherhood.com"
              class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              (blur)="onFieldBlur()"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg
                class="w-4 h-4 text-neutral-400"
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
            </button>
          </div>
          @if (form.get('externalLinkUrl')?.invalid &&
          form.get('externalLinkUrl')?.touched) {
          <p class="text-xs text-red-400">Please enter a valid URL</p>
          }
        </div>

        <!-- Additional Links -->
        @for (link of additionalLinks(); track $index) {
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-neutral-300"
              >additional link {{ $index + 1 }}</label
            >
            <button
              type="button"
              (click)="removeAdditionalLink($index)"
              class="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              remove
            </button>
          </div>
          <div class="relative">
            <input
              type="url"
              [value]="link"
              (input)="updateAdditionalLink($index, $event)"
              placeholder="https://example.com"
              class="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg
                class="w-4 h-4 text-neutral-400"
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
            </button>
          </div>
        </div>
        }

        <!-- Add Link Button -->
        <button
          type="button"
          (click)="addAdditionalLink()"
          class="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-all"
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
          <span class="text-sm font-medium">add another link</span>
        </button>
      </form>
    </div>
  `,
  styles: ``,
})
export class SocialsSectionComponent implements OnInit {
  @Input() profile: Profile | null = null;
  @Output() save = new EventEmitter<any>();

  private fb = inject(FormBuilder);

  form!: FormGroup;
  additionalLinks = signal<string[]>([]);
  isSaving = signal(false);
  private autosaveTimeout: any;

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  initializeForm() {
    this.form = this.fb.group({
      instaIdUrl: [
        '',
        [this.urlValidator.bind(this), this.instagramValidator.bind(this)],
      ],
      youtubeIdUrl: [
        '',
        [this.urlValidator.bind(this), this.youtubeValidator.bind(this)],
      ],
      externalLinkUrl: ['', [this.urlValidator.bind(this)]],
    });
  }

  populateForm() {
    if (!this.profile?.social) return;

    const social = this.profile.social;

    this.form.patchValue({
      instaIdUrl: social.instaIdUrl || '',
      youtubeIdUrl: social.youtubeIdUrl || '',
      externalLinkUrl: social.externalLinkUrl || '',
    });

    // Parse additional link if exists
    if (social.addLinkUrl) {
      this.additionalLinks.set([social.addLinkUrl]);
    }
  }

  // Validators
  private urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    try {
      const url = new URL(control.value);
      if (!url.protocol.startsWith('http')) {
        return { invalidUrl: true };
      }
      return null;
    } catch {
      // If it doesn't start with protocol, try adding it
      if (!control.value.startsWith('http')) {
        try {
          new URL('https://' + control.value);
          return null;
        } catch {
          return { invalidUrl: true };
        }
      }
      return { invalidUrl: true };
    }
  }

  private instagramValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    if (!control.value) return null;

    const urlError = this.urlValidator(control);
    if (urlError) return urlError;

    const value = control.value.toLowerCase();
    if (!value.includes('instagram.com') && !value.includes('instagr.am')) {
      return { notInstagramUrl: true };
    }

    return null;
  }

  private youtubeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const urlError = this.urlValidator(control);
    if (urlError) return urlError;

    const value = control.value.toLowerCase();
    if (!value.includes('youtube.com') && !value.includes('youtu.be')) {
      return { notYoutubeUrl: true };
    }

    return null;
  }

  addAdditionalLink() {
    const current = this.additionalLinks();
    this.additionalLinks.set([...current, '']);
  }

  updateAdditionalLink(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const current = this.additionalLinks();
    const updated = [...current];
    updated[index] = input.value;
    this.additionalLinks.set(updated);
    this.scheduleAutosave();
  }

  removeAdditionalLink(index: number) {
    const current = this.additionalLinks();
    this.additionalLinks.set(current.filter((_, i) => i !== index));
    this.scheduleAutosave();
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    if (!url.startsWith('http')) {
      return 'https://' + url;
    }
    return url;
  }

  onSave() {
    if (this.form.invalid) return;

    this.isSaving.set(true);

    const formValue = this.form.value;
    const additionalLink =
      this.additionalLinks().filter((link) => link.trim())[0] || '';

    const socialData: Social = {
      instaIdUrl: this.normalizeUrl(formValue.instaIdUrl),
      youtubeIdUrl: this.normalizeUrl(formValue.youtubeIdUrl),
      externalLinkUrl: this.normalizeUrl(formValue.externalLinkUrl),
      addLinkUrl: this.normalizeUrl(additionalLink),
    };

    this.save.emit({ social: socialData, autosave: true });

    setTimeout(() => {
      this.isSaving.set(false);
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }, 800);
  }

  onFieldBlur() {
    if (!this.form.dirty) {
      return;
    }
    this.scheduleAutosave();
  }

  private scheduleAutosave() {
    if (this.form.invalid || this.isSaving()) {
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
