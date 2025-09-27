import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface APITubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  categoryId: string;
  tags: string[];
}

export interface APITubeResponse {
  items: APITubeVideo[];
  nextPageToken?: string;
  totalResults: number;
}

export interface ContentCategory {
  id: string;
  name: string;
  titleKeyword: string;
  language?: string;
  country?: string;
}

export interface ContentType {
  id: string;
  name: string;
  titleKeywords: string[];
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class APITubeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.apitube.io/v1';
  private readonly apiKey = 'api_live_DWEwriq3gpPLEDqk8umF1dg70QRaVfdXLtAQEQV6sd';

  // Regional categories with proper language and country filters
  readonly categories: ContentCategory[] = [
    { id: 'bollywood', name: 'Bollywood', titleKeyword: 'Bollywood', language: 'hi', country: 'in' },
    { id: 'tollywood', name: 'Tollywood', titleKeyword: 'Tollywood', language: 'te', country: 'in' },
    { id: 'kollywood', name: 'Kollywood', titleKeyword: 'Kollywood', language: 'ta', country: 'in' },
    { id: 'mollywood', name: 'Mollywood', titleKeyword: 'Mollywood', language: 'ml', country: 'in' },
    { id: 'bengali', name: 'Bengali Cinema', titleKeyword: 'Bengali', language: 'bn', country: 'in' },
    { id: 'marathi', name: 'Marathi Cinema', titleKeyword: 'Marathi', language: 'mr', country: 'in' },
    { id: 'punjabi', name: 'Punjabi Cinema', titleKeyword: 'Punjabi', language: 'pa', country: 'in' },
    { id: 'gujarati', name: 'Gujarati Cinema', titleKeyword: 'Gujarati', language: 'gu', country: 'in' },
    { id: 'bhojpuri', name: 'Bhojpuri Cinema', titleKeyword: 'Bhojpuri', language: 'bh', country: 'in' },
    { id: 'hollywood', name: 'Hollywood', titleKeyword: 'Hollywood', language: 'en', country: 'us' },
    { id: 'assamese', name: 'Assamese | Independent', titleKeyword: 'Assamese', language: 'as', country: 'in' }
  ];

  // Media type segregation with keyword filters
  readonly contentTypes: ContentType[] = [
    { id: 'movies', name: 'Movies', titleKeywords: ['movie', 'film'], active: true },
    { id: 'television', name: 'Television', titleKeywords: ['television', 'tv series', 'tv show'], active: false },
    { id: 'drama', name: 'Drama', titleKeywords: ['drama'], active: false },
    { id: 'theatre', name: 'Theatre', titleKeywords: ['theatre', 'theater', 'play'], active: false },
    { id: 'plays', name: 'Plays', titleKeywords: ['play', 'stage'], active: false },
    { id: 'short-films', name: 'Short Films', titleKeywords: ['short film', 'short movie'], active: false },
    { id: 'music-videos', name: 'Music Videos', titleKeywords: ['music video', 'song'], active: false },
    { id: 'events', name: 'Events', titleKeywords: ['event', 'premiere', 'festival'], active: false }
  ];

  searchNewsByFilters(
    category: ContentCategory, 
    contentType: ContentType, 
    maxResults: number = 20, 
    pageToken?: string
  ): Observable<APITubeResponse> {
    let params = new HttpParams()
      .set('key', this.apiKey)
      .set('topic.id', 'movies_news')
      .set('maxResults', maxResults.toString());

    // Add regional filters
    if (category.titleKeyword) {
      params = params.set('title', category.titleKeyword);
    }
    
    if (category.language) {
      params = params.set('language', category.language);
    }
    
    if (category.country) {
      params = params.set('country', category.country);
    }

    // Add content type keywords
    if (contentType.titleKeywords.length > 0) {
      // Combine category keyword with content type keywords
      const combinedTitle = `${category.titleKeyword} ${contentType.titleKeywords[0]}`;
      params = params.set('title', combinedTitle);
    }

    if (pageToken) {
      params = params.set('pageToken', pageToken);
    }

    return this.http.get<any>(`${this.baseUrl}/news`, { params }).pipe(
      map(response => this.transformNewsResponse(response)),
      catchError(error => {
        console.error('APITube news search error:', error);
        return of({ items: [], totalResults: 0 });
      })
    );
  }

  // Fallback method for general video search if news API doesn't work well
  searchVideosByKeywords(
    category: ContentCategory, 
    contentType: ContentType, 
    maxResults: number = 20, 
    pageToken?: string
  ): Observable<APITubeResponse> {
    // Combine category and content type keywords for search
    const searchQuery = `${category.titleKeyword} ${contentType.titleKeywords.join(' OR ')}`;
    
    let params = new HttpParams()
      .set('key', this.apiKey)
      .set('q', searchQuery)
      .set('part', 'snippet')
      .set('type', 'video')
      .set('maxResults', maxResults.toString())
      .set('order', 'relevance')
      .set('safeSearch', 'moderate')
      .set('videoDefinition', 'any')
      .set('videoDuration', 'any');

    if (category.country) {
      params = params.set('regionCode', category.country.toUpperCase());
    }

    if (category.language) {
      params = params.set('relevanceLanguage', category.language);
    }

    if (pageToken) {
      params = params.set('pageToken', pageToken);
    }

    return this.http.get<any>(`${this.baseUrl}/search`, { params }).pipe(
      map(response => this.transformResponse(response)),
      catchError(error => {
        console.error('APITube video search error:', error);
        // Try the news API as fallback
        return this.searchNewsByFilters(category, contentType, maxResults, pageToken);
      })
    );
  }

  // Main method that tries news API first, then falls back to video search
  getContentByFilters(
    category: ContentCategory, 
    contentType: ContentType, 
    maxResults: number = 20, 
    pageToken?: string
  ): Observable<APITubeResponse> {
    return this.searchNewsByFilters(category, contentType, maxResults, pageToken).pipe(
      catchError(() => {
        // Fallback to video search if news API fails
        return this.searchVideosByKeywords(category, contentType, maxResults, pageToken);
      })
    );
  }

  private transformResponse(response: any): APITubeResponse {
    if (!response || !response.items) {
      return { items: [], totalResults: 0 };
    }

    const items: APITubeVideo[] = response.items.map((item: any) => ({
      id: item.id?.videoId || item.id,
      title: item.snippet?.title || 'Untitled',
      description: item.snippet?.description || '',
      thumbnail: item.snippet?.thumbnails?.high?.url || 
                 item.snippet?.thumbnails?.medium?.url || 
                 item.snippet?.thumbnails?.default?.url || '',
      duration: this.formatDuration(item.contentDetails?.duration),
      views: this.formatViews(item.statistics?.viewCount),
      publishedAt: item.snippet?.publishedAt || '',
      channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
      channelId: item.snippet?.channelId || '',
      categoryId: item.snippet?.categoryId || '',
      tags: item.snippet?.tags || []
    }));

    return {
      items,
      nextPageToken: response.nextPageToken,
      totalResults: response.pageInfo?.totalResults || items.length
    };
  }

  private transformNewsResponse(response: any): APITubeResponse {
    if (!response || !response.articles) {
      return { items: [], totalResults: 0 };
    }

    const items: APITubeVideo[] = response.articles.map((article: any) => ({
      id: article.id || article.url || Math.random().toString(36),
      title: article.title || 'Untitled',
      description: article.description || article.content || '',
      thumbnail: article.urlToImage || article.image || '',
      duration: '', // News articles don't have duration
      views: '', // News articles don't have view counts
      publishedAt: article.publishedAt || article.pubDate || '',
      channelTitle: article.source?.name || article.author || 'Unknown Source',
      channelId: article.source?.id || '',
      categoryId: 'news',
      tags: article.tags || []
    }));

    return {
      items,
      nextPageToken: response.nextPageToken,
      totalResults: response.totalResults || items.length
    };
  }

  private formatDuration(duration?: string): string {
    if (!duration) return '';
    
    // Parse ISO 8601 duration format (PT4M13S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private formatViews(views?: string): string {
    if (!views) return '0 views';
    
    const num = parseInt(views);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  }
}
