import { Component, input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../services/analytics.service';
import { AuthService } from '../../../services/auth.service';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
} from '@angular/fire/firestore';
import { DailyAnalyticsDoc } from '../../../../assets/interfaces/analytics.interfaces';
import { MediaUpload } from '../../../../assets/interfaces/interfaces';

interface AnalyticsViewModel {
  profileViews: number;
  avgProfileViewDuration: string;
  searchAppearances: number;
  totalVideoViews: number;
  avgVideoWatchTime: string;
  wishlistCount: number;
  visibilityScore: number;
  topVideo: {
    title: string;
    views: number;
    avgWatchTime: string;
  } | null;
  dailyData: DailyAnalyticsDoc[];
}

@Component({
  selector: 'app-analytics-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isSubscribed()) { @if (isLoading()) {
    <!-- Loading State -->
    <div
      class="flex flex-col items-center justify-center min-h-[400px] space-y-6"
    >
      <!-- Spinner -->
      <div class="relative">
        <svg
          class="w-12 h-12 text-purple-400 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>

      <!-- Rotating Message -->
      <div class="text-sm font-medium text-purple-300 animate-pulse">
        {{ getCurrentLoadingMessage() }}
      </div>
    </div>
    } @else {
    <!-- Analytics Content -->
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
              {{ analytics().profileViews.toLocaleString() }}
            </div>
          </div>
          <!-- Avg Time on Profile -->
          <div
            class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20"
          >
            <div class="text-xs text-purple-300/60 mb-1">Avg. Time</div>
            <div class="text-xs text-purple-300/60 mb-2">on Profile</div>
            <div class="text-2xl font-bold text-purple-100">
              {{ analytics().avgProfileViewDuration }}
            </div>
          </div>
          <!-- Wishlist Count -->
          <div
            class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20"
          >
            <div class="text-xs text-purple-300/60 mb-1">Wishlist Count</div>
            <div class="text-2xl font-bold text-purple-100 mt-4">
              {{ analytics().wishlistCount }}
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
                    analytics().visibilityScore * 10 + ', 100'
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
                  {{ analytics().visibilityScore }}
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
                {{ analytics().searchAppearances.toLocaleString() }}
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Video Analytics -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-purple-200">Video Performance</h3>
        <div class="bg-purple-950/20 rounded-xl p-4 ring-1 ring-purple-900/20">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div class="text-xs text-purple-300/60 mb-1">
                Total Video Views
              </div>
              <div class="text-2xl font-bold text-purple-100">
                {{ analytics().totalVideoViews.toLocaleString() }}
              </div>
            </div>
            <div>
              <div class="text-xs text-purple-300/60 mb-1">Avg. Watch Time</div>
              <div class="text-2xl font-bold text-purple-100">
                {{ analytics().avgVideoWatchTime }}
              </div>
            </div>
          </div>

          @if (analytics().topVideo) {
          <div class="border-t border-purple-900/30 pt-4">
            <div class="text-xs text-purple-300/60 mb-2">
              Top Performing Video
            </div>
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="text-sm font-medium text-purple-100 mb-1">
                  {{ analytics().topVideo!.title }}
                </div>
                <div class="text-xs text-purple-300/60">
                  {{ analytics().topVideo!.views }} views
                </div>
              </div>
              <div class="text-sm text-purple-300">
                {{ analytics().topVideo!.avgWatchTime }}
              </div>
            </div>
          </div>
          }
        </div>
      </div>
    </div>
    } } @else {
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
export class AnalyticsSectionComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  // Inputs
  isSubscribed = input.required<boolean>();
  upgradeSubscription = input.required<() => void>();

  // State
  analytics = signal<AnalyticsViewModel>({
    profileViews: 0,
    avgProfileViewDuration: 'N/A',
    searchAppearances: 0,
    totalVideoViews: 0,
    avgVideoWatchTime: 'N/A',
    wishlistCount: 0,
    visibilityScore: 0,
    topVideo: null,
    dailyData: [],
  });

  // Loading state
  isLoading = signal<boolean>(true);
  currentMessageIndex = signal<number>(0);
  private messageInterval: any = null;

  // Loading messages
  private readonly loadingMessages = [
    'Crunching the numbers...',
    'Calculating your star power...',
    'Analyzing your reach...',
    'Tallying up those profile views...',
    'Counting all those video watches...',
    'Seeing who wishlisted you...',
    'Checking your search appearances...',
    'Computing your visibility score...',
    'Reviewing your top performances...',
    'Mapping your growth trends...',
  ];

  async ngOnInit() {
    this.startMessageRotation();
    await this.loadAnalytics();
  }

  private async loadAnalytics() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    try {
      // 1. Load lifetime analytics
      const lifetimeData = await this.analyticsService.getLifetimeAnalytics(
        currentUser.uid
      );

      // 2. Load wishlist count
      const wishlistCount = await this.analyticsService.getWishlistCount(
        currentUser.uid
      );

      // 3. Load last 30 days of daily data (for trends)
      const endDate = this.getTodayId();
      const startDate = this.getDateIdDaysAgo(30);
      const dailyData = await this.analyticsService.getDailyAnalytics(
        currentUser.uid,
        startDate,
        endDate
      );

      // 4. Load video analytics (top video)
      const topVideo = await this.loadTopVideo(currentUser.uid);

      // 5. Calculate derived metrics
      const avgProfileViewDuration =
        lifetimeData?.totalProfileViewMs && lifetimeData?.profileViews
          ? this.formatDuration(
              lifetimeData.totalProfileViewMs / lifetimeData.profileViews / 1000
            )
          : 'N/A';

      const avgVideoWatchTime =
        lifetimeData?.totalWatchMs && lifetimeData?.totalVideoViews
          ? this.formatDuration(
              lifetimeData.totalWatchMs / lifetimeData.totalVideoViews / 1000
            )
          : 'N/A';

      const visibilityScore = await this.calculateVisibilityScore(
        lifetimeData?.profileViews || 0,
        wishlistCount,
        lifetimeData?.searchAppearances || 0,
        lifetimeData?.totalVideoViews || 0,
        lifetimeData?.totalWatchMs || 0
      );

      // 6. Update signal
      this.analytics.set({
        profileViews: lifetimeData?.profileViews || 0,
        avgProfileViewDuration,
        searchAppearances: lifetimeData?.searchAppearances || 0,
        totalVideoViews: lifetimeData?.totalVideoViews || 0,
        avgVideoWatchTime,
        wishlistCount,
        visibilityScore,
        topVideo,
        dailyData,
      });

      // Set loading to false
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Still set loading to false on error
      this.isLoading.set(false);
    }
  }

  private startMessageRotation(): void {
    if (this.messageInterval) return;

    this.messageInterval = setInterval(() => {
      if (!this.isLoading()) {
        this.stopMessageRotation();
        return;
      }

      const nextIndex =
        (this.currentMessageIndex() + 1) % this.loadingMessages.length;
      this.currentMessageIndex.set(nextIndex);
    }, 2000);
  }

  private stopMessageRotation(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
  }

  getCurrentLoadingMessage(): string {
    return this.loadingMessages[this.currentMessageIndex()];
  }

  ngOnDestroy() {
    this.stopMessageRotation();
  }

  private async loadTopVideo(userId: string): Promise<{
    title: string;
    views: number;
    avgWatchTime: string;
  } | null> {
    try {
      // Query uploads/{userId}/userUploads for videos
      const videosRef = collection(
        this.firestore,
        `uploads/${userId}/userUploads`
      );
      const q = query(videosRef, where('fileType', '==', 'video'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      // Find video with most views
      let topVideo: any = null;
      let maxViews = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as MediaUpload;
        // Type guard to ensure we're working with video metadata
        if (data.fileType === 'video' && data.metadata) {
          const metadata = data.metadata as any; // Use any to access analytics fields
          const viewCount = metadata.viewCount || 0;

          if (viewCount > maxViews) {
            maxViews = viewCount;
            topVideo = {
              title: metadata.description || 'Untitled',
              views: viewCount,
              totalWatchMs: metadata.totalWatchMs || 0,
            };
          }
        }
      });

      if (!topVideo) return null;

      const avgWatchTime =
        topVideo.views > 0
          ? this.formatDuration(topVideo.totalWatchMs / topVideo.views / 1000)
          : 'N/A';

      return {
        title: topVideo.title,
        views: topVideo.views,
        avgWatchTime,
      };
    } catch (error) {
      console.error('Error loading top video:', error);
      return null;
    }
  }

  private async calculateVisibilityScore(
    profileViews: number,
    wishlistCount: number,
    searchAppearances: number,
    totalVideoViews: number,
    totalWatchMs: number
  ): Promise<number> {
    /**
     * Percentile-based visibility score (0-10 scale)
     * Calculates where user ranks compared to all other users
     * Weights:
     * - Profile views: 25%
     * - Wishlist count: 35% (strongest signal)
     * - Search appearances: 15%
     * - Video views: 25%
     */

    try {
      // Calculate percentile for each metric in parallel
      const [profilePercentile, searchPercentile, videoPercentile] =
        await Promise.all([
          this.estimatePercentile('profileViews', profileViews),
          this.estimatePercentile('searchAppearances', searchAppearances),
          this.estimatePercentile('totalVideoViews', totalVideoViews),
        ]);

      // Wishlist uses benchmark since it's in separate collection
      const wishlistPercentile = Math.min(wishlistCount / 10, 1.0);

      // Weighted composite (0-1 scale)
      const composite =
        profilePercentile * 0.25 +
        wishlistPercentile * 0.35 +
        searchPercentile * 0.15 +
        videoPercentile * 0.25;

      const score = Math.round(composite * 10);

      return score;
    } catch (error) {
      // Fallback to benchmark-based scoring
      return this.fallbackBenchmarkScore(
        profileViews,
        wishlistCount,
        searchAppearances,
        totalVideoViews
      );
    }
  }

  /**
   * Estimate percentile rank for a metric using count queries
   * @param field Field name in user_analytics collection
   * @param value User's value for this field
   * @returns Percentile rank (0-1 scale)
   */
  private async estimatePercentile(
    field: string,
    value: number
  ): Promise<number> {
    try {
      const analyticsRef = collection(this.firestore, 'user_analytics');

      // Count users below this value
      const belowQuery = query(analyticsRef, where(field, '<', value));
      const belowCount = await getCountFromServer(belowQuery);

      // Count total users
      const totalQuery = query(analyticsRef);
      const totalCount = await getCountFromServer(totalQuery);

      const total = totalCount.data().count;
      if (total === 0) return 0;

      const percentile = belowCount.data().count / total;

      return percentile;
    } catch (error) {
      // If count query fails, return middle percentile
      return 0.5;
    }
  }

  /**
   * Fallback benchmark-based scoring when percentile calculation fails
   */
  private fallbackBenchmarkScore(
    profileViews: number,
    wishlistCount: number,
    searchAppearances: number,
    totalVideoViews: number
  ): number {
    // Define "good" benchmarks (each contributes 0-2.5 points)
    const benchmarks = {
      profileViews: 50,
      wishlistCount: 10,
      searchAppearances: 100,
      videoViews: 100,
    };

    const scores = {
      profile: Math.min((profileViews / benchmarks.profileViews) * 2.5, 2.5),
      wishlist: Math.min((wishlistCount / benchmarks.wishlistCount) * 2.5, 2.5),
      search: Math.min(
        (searchAppearances / benchmarks.searchAppearances) * 2.5,
        2.5
      ),
      video: Math.min((totalVideoViews / benchmarks.videoViews) * 2.5, 2.5),
    };

    return Math.round(
      scores.profile + scores.wishlist + scores.search + scores.video
    );
  }

  private formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return 'N/A';

    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  private getTodayId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private getDateIdDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  onUpgradeSubscription() {
    this.upgradeSubscription()();
  }
}
