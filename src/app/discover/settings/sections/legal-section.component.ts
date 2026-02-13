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
          <div>
            <h3 class="font-medium mb-3 text-base">TERMS OF SERVICE (ToS)</h3>
            <p class="text-xs mb-2">Effective Date: [Date]</p>
            <p class="text-xs mb-4">Jurisdiction: India (Governed by IT Act, 2000)</p>
          </div>

          <div>
            <h3 class="font-medium mb-2">1. Contractual Relationship</h3>
            <p>
              These Terms of Service ("Terms") govern the access or use by you ("User", "Actor", "Producer") of the platform "Kalacast" (the "App"), provided by [Your Company Name].
            </p>
            <p class="mt-2">
              <strong>Acceptance:</strong> By registering via Email or OTP, you enter into a binding contract with Kalacast.
            </p>
            <p class="mt-2">
              <strong>Age Restriction:</strong> You must be 18+ to register. Minors (under 18) must have accounts managed strictly by a parent/guardian.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">2. Account, Identity & Security</h3>
            <p>
              <strong>Verification:</strong> Accounts are authenticated via Mobile OTP or Google Auth. You agree that the mobile number provided belongs to you.
            </p>
            <p class="mt-2">
              <strong>Dual Roles:</strong> Users may switch between "Actor" and "Producer" profiles in Settings. You are responsible for all activities that occur under either role. Misusing the Producer role to harass Actors or scrape data for non-casting purposes will result in an immediate permanent ban.
            </p>
            <p class="mt-2">
              <strong>Ghost Mode:</strong> Enabling "Ghost Mode" hides your profile from Search and Discovery. However, existing chat threads and previously shared data with Producers may remain visible to them. Ghost Mode does not delete your data from our servers.
            </p>
            <p class="mt-2">
              <strong>Device Security:</strong> You are responsible for logging out of devices you no longer use. Kalacast is not liable for data breaches resulting from your failure to secure your device or OTP.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">3. Services & Communication</h3>
            <p>
              <strong>The Chat Protocol:</strong> Chat functionality is "Request-Based." A Producer may send a chat request; messaging capabilities are only unlocked once the Actor accepts the request.
            </p>
            <p class="mt-2">
              <strong>No Guarantee of Employment:</strong> Kalacast is an intermediary platform (venue). We do not guarantee auditions, roles, or employment. We are not responsible for the outcome of any interaction between Actor and Producer.
            </p>
            <p class="mt-2">
              <strong>Analytics Sharing:</strong>
            </p>
            <ul class="list-disc list-inside ml-4 mt-1">
              <li>For Actors: You acknowledge that your profile analytics (views, demographics) are derived from Producer activity.</li>
              <li>For Producers: You acknowledge that when you view an Actor's profile in depth, this interaction data is anonymized and shared with the Actor as part of their "Analytics" feature.</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">4. Subscriptions, Payments & Free Trial</h3>
            <p>
              <strong>90-Day Free Trial:</strong> All new users receive 90 days of premium access. Upon expiration, access to Premium Features (Search filters for Producers; Analytics/10 Reels for Actors) will be locked until a subscription is purchased.
            </p>
            <p class="mt-2">
              <strong>Pricing:</strong>
            </p>
            <ul class="list-disc list-inside ml-4 mt-1">
              <li>Actor: ₹222/mo or ₹2,222/yr.</li>
              <li>Producer: ₹2,222/mo or ₹22,222/yr.</li>
            </ul>
            <p class="mt-2">
              <strong>Automatic Renewal:</strong> Subscriptions auto-renew unless cancelled 24 hours prior to the cycle end.
            </p>
            <p class="mt-2">
              <strong>Refund Policy:</strong> Strict No-Refund Policy. Since Kalacast offers a 90-day trial to test the service, no refunds will be issued for subscriptions once paid, except where required by law.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">5. User-Generated Content (UGC) & License</h3>
            <p>
              <strong>Your Content:</strong> You retain ownership of your videos, voice intros, and photos.
            </p>
            <p class="mt-2">
              <strong>License to Kalacast:</strong> By uploading, you grant Kalacast a worldwide, non-exclusive, royalty-free license to host, store (via Google Cloud), modify (for transcoding/compression), and display your content to other Users for the purpose of operating the App.
            </p>
            <p class="mt-2">
              <strong>Prohibited Content:</strong> You strictly agree NOT to upload:
            </p>
            <ul class="list-disc list-inside ml-4 mt-1">
              <li>Nudity or sexually explicit material.</li>
              <li>Content that infringes on third-party copyrights (e.g., movie clips you do not own rights to).</li>
              <li>Misleading tags (e.g., tagging a "Comedy" video as "Action" to game the search results).</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">6. Limitation of Liability & Indemnity</h3>
            <p>
              <strong>Indemnity:</strong> You agree to indemnify and hold Kalacast harmless from any claims, legal fees, or damages arising from your content (e.g., if you upload a copyrighted song in your audition tape) or your conduct off-app (e.g., physical auditions).
            </p>
            <p class="mt-2">
              <strong>Service Availability:</strong> We do not guarantee 100% uptime. Services may be interrupted for maintenance.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">7. Termination</h3>
            <p>
              Kalacast reserves the right to suspend or delete your account without notice if you violate these Terms, specifically regarding harassment, fake profiles, or safety violations.
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
          <div>
            <h3 class="font-medium mb-3 text-base">PRIVACY POLICY</h3>
            <p class="text-xs mb-4">Note: This policy is drafted in compliance with the Digital Personal Data Protection (DPDP) Act.</p>
          </div>

          <div>
            <h3 class="font-medium mb-2">1. Data We Collect</h3>
            <p>To operate Kalacast, we collect:</p>
            <ul class="list-disc list-inside ml-4 mt-2">
              <li><strong>Identity Data:</strong> Name, Age, Gender, Location, Mobile Number, Email ID.</li>
              <li><strong>Physical Characteristics:</strong> Height, Body Type (essential for Casting search).</li>
              <li><strong>Professional Data:</strong> Education (School, Course, Year), Experience (Role, Genre, Project Link), Skills, Languages.</li>
              <li><strong>Biometric & Media Data:</strong> Photographs, Audition Videos (User-tagged), Voice Intro (30-sec Audio).</li>
              <li><strong>Device Data:</strong> IP Address, Device Model (for "Recent Logins" security feature).</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">2. How We Use Your Data</h3>
            <p>
              <strong>Matchmaking:</strong> To index your profile in the "Producer Search" engine using filters like height, age, and skills.
            </p>
            <p class="mt-2">
              <strong>Analytics:</strong> To generate performance reports. Actors can see that they were viewed; Producers' specific identities are protected unless they interact.
            </p>
            <p class="mt-2">
              <strong>Communication:</strong> To facilitate the Chat Request system and send OTPs.
            </p>
            <p class="mt-2">
              <strong>Ghost Mode:</strong> When enabled, we process a "flag" on your account that removes your profile from public query results, though your data remains stored.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">3. Data Storage & Retention</h3>
            <p>
              <strong>Infrastructure:</strong> All data, including high-resolution video and images, is stored securely on Google Cloud Platform (GCP) servers.
            </p>
            <p class="mt-2">
              <strong>Retention:</strong> We retain your data as long as your account is active.
            </p>
            <p class="mt-2">
              <strong>Deletion:</strong> If you select "Delete Account" in Settings, your data is marked for permanent deletion after a 30-day grace period, barring any legal requirement to retain transaction records.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">4. Disclosure to Third Parties</h3>
            <p>We do not sell your data. We share data only with:</p>
            <ul class="list-disc list-inside ml-4 mt-2">
              <li><strong>Cloud Providers:</strong> Google Cloud (for hosting).</li>
              <li><strong>Payment Processors:</strong> (e.g., Razorpay/Stripe) for subscription processing.</li>
              <li><strong>Legal Authorities:</strong> If required by Indian Law Enforcement agencies via valid legal process.</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">5. Your Rights & Controls</h3>
            <p>
              <strong>Ghost Mode:</strong> You may toggle visibility instantly in Privacy Settings.
            </p>
            <p class="mt-2">
              <strong>Block & Report:</strong> You may block users or report specific chat messages.
            </p>
            <p class="mt-2">
              <strong>Session Management:</strong> You can view "Recent Logins" and "Log Out of All Devices" via Settings.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">6. Grievance Redressal</h3>
            <p>If you have concerns regarding your data or safety:</p>
            <p class="mt-2">
              Grievance Officer: [Name]<br/>
              Email: [support&#64;kalacast.com]<br/>
              Address: [Your Office Address, Kochi]
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
          <div>
            <h3 class="font-medium mb-3 text-base">COMMUNITY GUIDELINES</h3>
            <p class="mb-4">The Kalacast Code of Conduct</p>
          </div>

          <div>
            <h3 class="font-medium mb-2">1. Authenticity & Integrity</h3>
            <p>
              <strong>No Catfishing:</strong> Your profile photos must be recent and of you. Impersonating other actors or producers is grounds for a permanent ban.
            </p>
            <p class="mt-2">
              <strong>Honest Tagging:</strong> Do not misuse "Emotion Tags." If a video is a "Monologue," do not tag it as "Stunt" just to get views. Misleading metadata hurts the ecosystem and lowers your trust score.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">2. Safety & Respect</h3>
            <p>
              <strong>Chat Etiquette:</strong> The "Request" feature exists for a reason. Producers must send professional initial requests. Actors have the absolute right to Decline.
            </p>
            <p class="mt-2">
              <strong>Zero Tolerance for Harassment:</strong> Any user (Actor or Producer) found sending abusive, sexual, or threatening messages will be banned. We keep "Read Receipts" and chat logs for moderation purposes if a report is filed.
            </p>
            <p class="mt-2">
              <strong>Physical Safety:</strong> Kalacast is an online discovery tool. We strongly advise that all in-person auditions take place in public, professional environments.
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">3. Content Standards</h3>
            <p>
              <strong>No Nudity:</strong> This is a professional casting platform. No swimsuit/lingerie photos unless explicitly required for a verified modeling portfolio, and strictly NO full nudity.
            </p>
            <p class="mt-2">
              <strong>Copyright:</strong> Only upload showreels that you have permission to use. Do not upload copyrighted movie clips, songs, or other content that you do not have rights to use.
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
