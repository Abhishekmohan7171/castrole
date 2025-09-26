import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../common-components/loader/loader.component';

@Component({
  selector: 'app-auth-loading',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
    <div class="fixed inset-0 bg-neutral-900 z-50 flex items-center justify-center">
      <app-loader [show]="true" [overlay]="false" message="Loading application..."></app-loader>
    </div>
  `,
})
export class AuthLoadingComponent {}
