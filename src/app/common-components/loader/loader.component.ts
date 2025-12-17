import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="show" 
      class="fixed inset-0 flex items-center justify-center z-50"
      [ngClass]="{'bg-black/70': overlay}"
    >
      <div class="relative">
        <!-- Outer ring -->
        <div class="w-16 h-16 rounded-full border-2 border-t-transparent border-neutral-700 animate-spin"></div>
        
        <!-- Inner ring -->
        <div 
          class="absolute top-1 left-1 w-14 h-14 rounded-full border-2 border-b-transparent animate-spin-reverse"
          [ngClass]="{
            'border-[#946BA9]': isActor,
            'border-[#90ACC8]': !isActor
          }"
        ></div>
        
        <!-- Center dot -->
        <div class="absolute top-[0.4rem] left-[0.4rem] w-12 h-12 rounded-full bg-black flex items-center justify-center">
          <div 
            class="w-2 h-2 rounded-full animate-pulse"
            [ngClass]="{
              'bg-[#946BA9]': isActor,
              'bg-[#90ACC8]': !isActor
            }"
          ></div>
        </div>
        
        <!-- Message below loader -->
        <div *ngIf="message" class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-neutral-300 text-sm">
          {{ message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin-reverse {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
    .animate-spin-reverse {
      animation: spin-reverse 1.2s linear infinite;
    }
  `]
})
export class LoaderComponent {
  @Input() show: boolean = true;
  @Input() overlay: boolean = true;
  @Input() message: string = '';
  @Input() isActor: boolean = true;
}
