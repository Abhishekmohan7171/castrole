import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAnalytics } from '../../../../assets/interfaces/interfaces';

@Component({
  selector: 'app-analytics-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isSubscribed()) {
    <div class="space-y-8">
      <!-- Profile Overview -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-purple-200">Profile Overview</h3>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Profile Views -->
          <div
            class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20"
          >
            <div class="text-xs text-purple-300/60 mb-1">Profile Views</div>
            <div class="text-xs text-purple-300/60 mb-2">by Producers</div>
            <div class="text-2xl font-bold text-purple-100">
              {{ (getProfileOverview().profileViews || 0).toLocaleString() }}
            </div>
          </div>
          <!-- Wishlist Count -->
          <div
            class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20"
          >
            <div class="text-xs text-purple-300/60 mb-1">Wishlist Count</div>
            <div class="text-2xl font-bold text-purple-100 mt-4">
              {{ getProfileOverview().wishlistCount || 0 }}
            </div>
          </div>
          <!-- Avg Time on Profile -->
          <div
            class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20"
          >
            <div class="text-xs text-purple-300/60 mb-1">Avg. Time</div>
            <div class="text-xs text-purple-300/60 mb-2">on Profile</div>
            <div class="text-2xl font-bold text-purple-100">
              {{ getProfileOverview().avgTimeOnProfile || 'N/A' }}
            </div>
          </div>
          <!-- Visibility Score -->
          <div
            class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20 flex flex-col items-center"
          >
            <div class="relative mb-3">
              <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  class="stroke-purple-900/30"
                  fill="none"
                  stroke-width="2"
                  stroke-dasharray="100, 100"
                  d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="stroke-purple-400"
                  [attr.stroke-dasharray]="
                    (getProfileOverview().visibilityScore || 0) + ', 100'
                  "
                  d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke-width="2"
                />
              </svg>
              <div
                class="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div
                  class="text-xs text-purple-300/60 font-medium tracking-wide mb-1"
                >
                  SCORE
                </div>
                <div class="text-xl font-bold text-purple-100">
                  {{ getProfileOverview().visibilityScore || 0 }}
                </div>
              </div>
            </div>
            <div class="text-xs text-purple-300/50 text-center">
              Visibility Score
            </div>
          </div>
        </div>
      </div>

      <!-- Search Appearances -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-purple-200">Search Appearances</h3>
        <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="text-2xl font-bold text-purple-100">
                {{ getSearchAppearances().count }}
              </div>
              <div class="text-xs text-purple-300/60">
                Times your profile appeared in producer searches
              </div>
            </div>
            <svg
              class="w-6 h-6 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <!-- Videos they saw -->
          <div class="space-y-2">
            @for (video of getSearchAppearances().videos; track video.title) {
            <div
              class="flex items-center gap-3 p-2 bg-purple-900/20 rounded-lg"
            >
              <div
                class="w-8 h-8 bg-purple-800/50 rounded-lg flex items-center justify-center"
              >
                <svg
                  class="w-4 h-4 text-purple-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span class="text-sm text-purple-200">{{ video.title }}</span>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- Top Performing Video -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-purple-200">
          Top Performing Video
        </h3>
        <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
          <div class="space-y-4">
            <div>
              <div class="text-sm font-medium text-purple-100 mb-1">
                {{ getTopPerformingVideo().title }}
              </div>
              <div class="text-xs text-purple-300/60">
                {{ getTopPerformingVideo().views }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-center">
              <div>
                <div class="text-xs text-purple-300/60">Views</div>
                <div class="text-sm font-medium text-purple-100">
                  {{ getTopPerformingVideo().views }}
                </div>
              </div>
              <div>
                <div class="text-xs text-purple-300/60">Average</div>
                <div class="text-xs text-purple-300/60">Watch Time</div>
                <div class="text-sm font-medium text-purple-100">
                  {{ getTopPerformingVideo().avgWatchTime }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tag Insights -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-purple-200">Tag Insights</h3>
        <div
          class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20 space-y-3"
        >
          @for (tag of getTagInsights(); track tag.tag) {
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-purple-200">{{ tag.tag }}</span>
              <span class="text-xs text-purple-300/60"
                >{{ tag.percentage }}%</span
              >
            </div>
            <div class="w-full bg-purple-900/30 rounded-full h-2">
              <div
                class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                [style.width.%]="tag.percentage"
              ></div>
            </div>
          </div>
          }
        </div>
      </div>
    </div>
    } @else {
    <div class="py-16">
      <div
        class="max-w-md mx-auto px-8 py-12 text-center flex flex-col items-center gap-6 rounded-2xl border border-purple-900/40 bg-purple-950/20"
      >
        <div class="flex justify-center">
          <svg
            class="w-20 h-20 text-purple-300/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <!-- Upgrade Message -->
        <h3 class="text-lg font-semibold text-purple-100 leading-snug">
          Upgrade to premium for detailed analytics
        </h3>
        <!-- Go Premium Button -->
        <button
          class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-10 rounded-full transition-colors duration-200"
          (click)="onUpgradeSubscription()"
        >
          Go Premium
        </button>
      </div>
    </div>
    }
  `,
})
export class AnalyticsSectionComponent {
  isSubscribed = input.required<boolean>();
  analyticsData = input.required<UserAnalytics | null>();
  upgradeSubscription = input.required<() => void>();

  onUpgradeSubscription() {
    this.upgradeSubscription()();
  }

  // Helper to format seconds to readable time
  formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  }

  // Safe access methods for analytics data
  getProfileOverview() {
    const data = this.analyticsData();
    if (!data) {
      return {
        profileViews: 0,
        wishlistCount: 0,
        avgTimeOnProfile: 'N/A',
        visibilityScore: 0,
      };
    }

    return {
      profileViews: data.profileViews.total || 0,
      wishlistCount: data.wishlistCount || 0,
      avgTimeOnProfile: this.formatDuration(data.profileViews.avgDuration),
      visibilityScore: Math.round(data.visibilityScore || 0),
    };
  }

  getSearchAppearances() {
    // Phase 1: Not yet implemented
    return {
      count: 0,
      videos: [] as Array<{ title: string; thumbnail: string }>
    };
  }

  getTopPerformingVideo() {
    // Phase 1: Not yet implemented
    return {
      title: 'N/A',
      views: 'Coming soon',
      avgWatchTime: 'N/A',
    };
  }

  getTagInsights() {
    // Phase 1: Not yet implemented
    return [] as Array<{ tag: string; percentage: number }>;
  }
}
