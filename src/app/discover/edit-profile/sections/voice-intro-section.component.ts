import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { Subject, Observable, of } from 'rxjs';
import { ComponentCanDeactivate } from '../../../guards/pending-changes.guard';
import { CommonModule } from '@angular/common';
import { Storage, ref, uploadBytes, getDownloadURL, listAll } from '@angular/fire/storage';
import { Profile } from '../../../../assets/interfaces/profile.interfaces';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-voice-intro-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Description -->
      <div class="bg-neutral-800/30 rounded-xl p-6 border border-neutral-700/50">
        <p class="text-neutral-300 leading-relaxed">
          Your voice is part of your consciousness. It adds depth to who you are.
        </p>
        <p class="text-neutral-400 text-sm mt-3">
          A 30-second intro in your native language lets casting professionals experience your tone, accent, and presence, helping match you to the right roles.
        </p>
      </div>

      <!-- Audio Player / Recorder -->
      <div class="bg-neutral-800/30 rounded-xl p-8 border border-neutral-700/50">
        @if (currentVoiceUrl()) {
          <!-- Existing Audio -->
          <div class="space-y-6">
            <!-- Waveform Visualization -->
            <div class="relative h-24 flex items-center justify-center bg-neutral-900/50 rounded-lg overflow-hidden">
              <svg class="w-full h-full px-4" viewBox="0 0 400 100" preserveAspectRatio="none">
                <path
                  [attr.d]="waveformPath()"
                  fill="none"
                  stroke="url(#waveGradient)"
                  stroke-width="2"
                  class="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#a855f7;stop-opacity:0.6" />
                    <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.6" />
                  </linearGradient>
                </defs>
              </svg>
              
              <!-- Duration Display -->
              <div class="absolute top-2 right-2 px-3 py-1 bg-black/50 rounded-full text-xs text-white">
                {{ currentTime() }} / {{ duration() }} s
              </div>
            </div>

            <!-- Audio Element (Hidden) -->
            <audio
              #audioPlayer
              [src]="currentVoiceUrl()"
              (loadedmetadata)="onAudioLoaded(audioPlayer)"
              (timeupdate)="onTimeUpdate(audioPlayer)"
              (ended)="onAudioEnded()"
            ></audio>

            <!-- Playback Controls -->
            <div class="flex items-center justify-center gap-4">
              <button
                type="button"
                (click)="togglePlayback(audioPlayer)"
                class="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-all duration-200 shadow-lg shadow-purple-500/30"
              >
                @if (isPlaying()) {
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                } @else {
                  <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                }
              </button>

              <button
                type="button"
                (click)="removeVoiceIntro()"
                class="p-3 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- Edit Intro Button -->
            <div class="flex justify-center">
              <button
                type="button"
                (click)="startNewRecording()"
                class="px-6 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium rounded-xl transition-all duration-200"
              >
                edit intro
              </button>
            </div>
          </div>
        } @else {
          <!-- Recording Interface -->
          <div class="space-y-6">
            @if (isRecording()) {
              <!-- Recording in Progress -->
              <div class="space-y-6">
                <!-- Animated Waveform -->
                <div class="relative h-24 flex items-center justify-center bg-neutral-900/50 rounded-lg overflow-hidden">
                  <div class="flex items-center justify-center gap-1">
                    @for (bar of recordingBars; track $index) {
                      <div
                        class="w-1 bg-purple-500 rounded-full animate-pulse"
                        [style.height.px]="bar"
                        [style.animation-delay]="$index * 0.1 + 's'"
                      ></div>
                    }
                  </div>
                  
                  <!-- Recording Time -->
                  <div class="absolute top-2 right-2 px-3 py-1 bg-red-600/80 rounded-full text-xs text-white flex items-center gap-2">
                    <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    {{ recordingTime() }}s / 30s
                  </div>
                </div>

                <!-- Stop Recording Button -->
                <div class="flex justify-center">
                  <button
                    type="button"
                    (click)="stopRecording()"
                    class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-500/30"
                  >
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                </div>
              </div>
            } @else if (isUploading()) {
              <!-- Uploading State -->
              <div class="flex flex-col items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p class="text-neutral-300">Uploading your voice intro...</p>
              </div>
            } @else {
              <!-- Start Recording -->
              <div class="flex flex-col items-center justify-center py-8 space-y-6">
                <button
                  type="button"
                  (click)="startRecording()"
                  class="w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-all duration-200 shadow-lg shadow-purple-500/30 group"
                >
                  <svg class="w-10 h-10 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <p class="text-sm text-neutral-400">tap to start recording</p>

                <!-- Upload Option -->
                <div class="relative">
                  <input
                    #audioInput
                    type="file"
                    accept="audio/*"
                    (change)="onAudioFileSelect($event)"
                    class="hidden"
                  />
                  <button
                    type="button"
                    (click)="audioInput.click()"
                    class="text-sm text-purple-400 hover:text-purple-300 transition-colors underline"
                  >
                    or upload audio file
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `
})
export class VoiceIntroSectionComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  private destroy$ = new Subject<void>();

  @Input() profile: Profile | null = null;
  @Output() save = new EventEmitter<any>();

  private storage = inject(Storage);
  private dialogService = inject(DialogService);

  currentVoiceUrl = signal<string | null>(null);
  isRecording = signal(false);
  isPlaying = signal(false);
  isUploading = signal(false);
  isSaving = signal(false);
  recordingTime = signal(0);
  currentTime = signal(0);
  duration = signal(0);
  hasChanges = signal(false);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingInterval: any;
  private audioElement: HTMLAudioElement | null = null;

  recordingBars = [20, 40, 60, 40, 20, 40, 60, 80, 60, 40, 20, 40, 60, 40, 20];
  private staticWaveform = signal<string>('');

  ngOnInit() {
    this.initializeWaveform();
    if (this.profile?.actorProfile?.voiceIntro) {
      this.currentVoiceUrl.set(this.profile.actorProfile.voiceIntro);
    } else {
      this.checkForExistingVoiceIntro();
    }
  }

  private initializeWaveform() {
    // Generate a static waveform path once to avoid change detection issues
    const points: string[] = [];
    const segments = 50;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 400;
      const height = 20 + Math.sin(i * 0.3) * 15 + Math.sin(i * 0.8) * 10;
      const y = 50 + (i % 2 === 0 ? height : -height);
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    
    this.staticWaveform.set(points.join(' '));
  }

  waveformPath(): string {
    return this.staticWaveform();
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.recordingTime.set(0);

      // Start timer (max 30 seconds)
      this.recordingInterval = setInterval(() => {
        const time = this.recordingTime() + 1;
        this.recordingTime.set(time);
        
        if (time >= 30) {
          this.stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.dialogService.error('Could not access microphone. Please check permissions.', 'actor');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      clearInterval(this.recordingInterval);
    }
  }

  async onAudioFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      this.dialogService.error('Please select an audio file', 'actor');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.dialogService.error('Audio file must be less than 10MB', 'actor');
      return;
    }

    await this.uploadAudio(file);
  }

  async uploadAudio(audioBlob: Blob | File) {
    this.isUploading.set(true);

    try {
      const timestamp = Date.now();
      
      // Determine file extension
      let extension = 'webm'; // default for recorded audio
      if (audioBlob instanceof File) {
        extension = audioBlob.name.split('.').pop() || 'webm';
      }
      
      // Use the same directory structure as edit-profile-modal
      const fileName = `users/${this.profile?.uid}/voice/voice_intro_${timestamp}.${extension}`;
      const storageRef = ref(this.storage, fileName);
      
      await uploadBytes(storageRef, audioBlob);
      const downloadURL = await getDownloadURL(storageRef);

      this.currentVoiceUrl.set(downloadURL);
      this.hasChanges.set(true);

      // Auto-save immediately after upload completes
      this.onSave();
    } catch (error) {
      console.error('Error uploading audio:', error);
      this.dialogService.error('Failed to upload audio. Please try again.', 'actor');
    } finally {
      this.isUploading.set(false);
    }
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
        this.currentVoiceUrl.set(downloadURL);
      }
    } catch (error) {
      // No voice directory or files exist, which is fine
      this.currentVoiceUrl.set(null);
    }
  }

  onAudioLoaded(audio: HTMLAudioElement) {
    this.audioElement = audio;
    this.duration.set(Math.floor(audio.duration));
  }

  togglePlayback(audio: HTMLAudioElement) {
    if (this.isPlaying()) {
      audio.pause();
      this.isPlaying.set(false);
    } else {
      audio.play();
      this.isPlaying.set(true);
    }
  }

  onTimeUpdate(audio: HTMLAudioElement) {
    this.currentTime.set(Math.floor(audio.currentTime));
  }

  onAudioEnded() {
    this.isPlaying.set(false);
    this.currentTime.set(0);
  }

  removeVoiceIntro() {
    if (confirm('Are you sure you want to remove your voice intro?')) {
      this.currentVoiceUrl.set(null);
      this.hasChanges.set(true);

      // Auto-save immediately after removal
      this.onSave();

      if (this.audioElement) {
        this.audioElement.pause();
        this.isPlaying.set(false);
      }
    }
  }

  startNewRecording() {
    this.currentVoiceUrl.set(null);
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying.set(false);
    }
  }

  onSave() {
    this.isSaving.set(true);

    this.save.emit({
      voiceIntro: this.currentVoiceUrl(),
      autosave: true
    });

    setTimeout(() => {
      this.isSaving.set(false);
      this.hasChanges.set(false);
    }, 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up audio element
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.hasChanges() && !this.isSaving()) {
      // Force immediate save before navigation
      this.onSave();
      return of(true);
    }
    return true;
  }
}
