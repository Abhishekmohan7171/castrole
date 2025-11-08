import { Component, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-legal-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      @switch (legalActiveView()) { @case ('menu') {
      <!-- Legal Menu -->
      <div class="space-y-6">
        <div
          class="text-xs font-medium uppercase tracking-wide"
          [ngClass]="{
            'text-purple-300/50': isActor(),
            'text-neutral-500': !isActor()
          }"
        >
          Legal Documents
        </div>

        <div class="space-y-3">
          <!-- Terms & Conditions -->
          <button
            (click)="onSetLegalView('terms')"
            class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <div class="flex items-center gap-3">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div class="text-left">
                <h3 class="text-sm font-medium">Terms & Conditions</h3>
                <p class="text-xs opacity-70">Terms of service and usage</p>
              </div>
            </div>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <!-- Privacy Policy -->
          <button
            (click)="onSetLegalView('privacy')"
            class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <div class="flex items-center gap-3">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div class="text-left">
                <h3 class="text-sm font-medium">Privacy Policy</h3>
                <p class="text-xs opacity-70">How we handle your data</p>
              </div>
            </div>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <!-- Community Guidelines -->
          <button
            (click)="onSetLegalView('guidelines')"
            class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <div class="flex items-center gap-3">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div class="text-left">
                <h3 class="text-sm font-medium">Community Guidelines</h3>
                <p class="text-xs opacity-70">Rules and conduct standards</p>
              </div>
            </div>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <!-- About Us -->
          <button
            (click)="onSetLegalView('about')"
            class="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'bg-purple-950/10 border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'bg-black/20 border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
          >
            <div class="flex items-center gap-3">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="text-left">
                <h3 class="text-sm font-medium">About Us</h3>
                <p class="text-xs opacity-70">Company information</p>
              </div>
            </div>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
      } @case ('terms') {
      <!-- Terms & Conditions Content -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <button
            (click)="onSetLegalView('menu')"
            class="p-2 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3
            class="text-lg font-medium"
            [ngClass]="{
              'text-purple-200': isActor(),
              'text-neutral-200': !isActor()
            }"
          >
            Terms & Conditions
          </h3>
        </div>
        <div
          class="prose prose-sm max-w-none"
          [ngClass]="{
            'prose-purple text-purple-200/80': isActor(),
            'prose-neutral text-neutral-300': !isActor()
          }"
        >
          <!-- Terms content would go here -->
          <div>
            <h3 class="font-medium mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing and using Castrole, you accept and agree to be bound
              by the terms and provision of this agreement.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">2. User Accounts</h3>
            <p>
              You are responsible for maintaining the confidentiality of your
              account and password. You agree to accept responsibility for all
              activities that occur under your account.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">3. Platform Usage</h3>
            <p>
              Castrole provides a platform connecting actors and producers.
              Users must use the service in accordance with applicable laws and
              these terms.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">4. Content Guidelines</h3>
            <p>
              All content uploaded must be appropriate and comply with our
              community guidelines. We reserve the right to remove content that
              violates these terms.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">5. Limitation of Liability</h3>
            <p>
              Castrole shall not be liable for any direct, indirect, incidental,
              special, or consequential damages resulting from your use of the
              platform.
            </p>
          </div>
        </div>
      </div>
      } @case ('privacy') {
      <!-- Privacy Policy Content -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <button
            (click)="onSetLegalView('menu')"
            class="p-2 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3
            class="text-lg font-medium"
            [ngClass]="{
              'text-purple-200': isActor(),
              'text-neutral-200': !isActor()
            }"
          >
            Privacy Policy
          </h3>
        </div>
        <div
          class="prose prose-sm max-w-none"
          [ngClass]="{
            'prose-purple text-purple-200/80': isActor(),
            'prose-neutral text-neutral-300': !isActor()
          }"
        >
          <!-- Privacy policy content-->
          <div>
            <h3 class="font-medium mb-2">Information We Collect</h3>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, update your profile, or contact us for
              support.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">How We Use Your Information</h3>
            <p>
              We use the information we collect to provide, maintain, and
              improve our services, process transactions, and communicate with
              you.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Information Sharing</h3>
            <p>
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information in certain limited
              circumstances as outlined in this policy.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Data Security</h3>
            <p>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Your Rights</h3>
            <p>
              You have the right to access, update, or delete your personal
              information. You may also opt out of certain communications from
              us.
            </p>
          </div>
        </div>
      </div>
      } @case ('guidelines') {
      <!-- Community Guidelines Content -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <button
            (click)="onSetLegalView('menu')"
            class="p-2 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3
            class="text-lg font-medium"
            [ngClass]="{
              'text-purple-200': isActor(),
              'text-neutral-200': !isActor()
            }"
          >
            Community Guidelines
          </h3>
        </div>
        <div
          class="prose prose-sm max-w-none"
          [ngClass]="{
            'prose-purple text-purple-200/80': isActor(),
            'prose-neutral text-neutral-300': !isActor()
          }"
        >
          <!-- Community guidelines content would go here -->
          <div>
            <h3 class="font-medium mb-2">Respectful Communication</h3>
            <p>
              Treat all community members with respect and professionalism.
              Harassment, discrimination, or abusive behavior is not tolerated.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Authentic Content</h3>
            <p>
              Share only authentic content that accurately represents your work
              and capabilities. Misleading information or impersonation is
              prohibited.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Professional Conduct</h3>
            <p>
              Maintain professional standards in all interactions. This includes
              timely communication and honoring commitments made through the
              platform.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Content Standards</h3>
            <p>
              All uploaded content must be appropriate for a professional
              environment. Explicit, offensive, or inappropriate material will
              be removed.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Reporting Violations</h3>
            <p>
              If you encounter behavior that violates these guidelines, please
              report it through our support system. We take all reports
              seriously.
            </p>
          </div>
        </div>
      </div>
      } @case ('about') {
      <!-- About Us Content -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <button
            (click)="onSetLegalView('menu')"
            class="p-2 rounded-lg border transition-all duration-200"
            [ngClass]="{
              'border-purple-900/20 hover:bg-purple-950/20 text-purple-200':
                isActor(),
              'border-neutral-700/50 hover:bg-black/30 text-neutral-200':
                !isActor()
            }"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3
            class="text-lg font-medium"
            [ngClass]="{
              'text-purple-200': isActor(),
              'text-neutral-200': !isActor()
            }"
          >
            About Us
          </h3>
        </div>
        <div
          class="prose prose-sm max-w-none"
          [ngClass]="{
            'prose-purple text-purple-200/80': isActor(),
            'prose-neutral text-neutral-300': !isActor()
          }"
        >
          <!-- About us content -->
          <div>
            <h3 class="font-medium mb-2">Our Mission</h3>
            <p>
              Castrole is dedicated to connecting talented actors with visionary
              producers, creating opportunities in the entertainment industry.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">What We Do</h3>
            <p>
              We provide a platform where actors can showcase their talents and
              producers can discover the perfect talent for their projects.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Our Values</h3>
            <p>
              We believe in fostering creativity, promoting diversity, and
              supporting the dreams of entertainment professionals worldwide.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Company Information</h3>
            <p>
              Founded in 2024, Castrole is committed to revolutionizing how the
              entertainment industry connects and collaborates.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">Contact Us</h3>
            <p>
              Have questions? Reach out to us at support&#64;castrole.com or
              through our support form in the settings.
            </p>
          </div>
        </div>
      </div>
      } }
    </div>
  `,
})
export class LegalSectionComponent implements OnInit {
  isActor = input.required<boolean>();
  legalActiveView = signal<
    'menu' | 'terms' | 'privacy' | 'guidelines' | 'about'
  >('menu');

  ngOnInit(): void {
    this.setLegalView('menu');
  }

  setLegalView(view: 'menu' | 'terms' | 'privacy' | 'guidelines' | 'about') {
    this.legalActiveView.set(view);
  }

  onSetLegalView(view: 'menu' | 'terms' | 'privacy' | 'guidelines' | 'about') {
    this.setLegalView(view);
  }
}
