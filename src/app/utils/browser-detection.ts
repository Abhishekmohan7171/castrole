import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/**
 * Browser detection service to get browser information
 * Compatible with SSR (Server-Side Rendering)
 */
@Injectable({ providedIn: 'root' })
export class BrowserDetectionService {
  private platformId = inject(PLATFORM_ID);

  /**
   * Detects browser information
   * @returns Object containing platform, model, and version
   */
  detectBrowser(): { platform: string; model: string; version: string } {
    // Default values
    const result = {
      platform: '',
      model: '',
      version: ''
    };

    // Check if we're in a browser environment
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent;
      
      // Detect browser platform
      if (userAgent.indexOf('Chrome') !== -1) {
        result.platform = 'Chrome';
        // Extract Chrome version
        const chromeVersion = userAgent.match(/Chrome\/(\d+\.\d+)/);
        if (chromeVersion && chromeVersion[1]) {
          result.version = chromeVersion[1];
        }
      } else if (userAgent.indexOf('Firefox') !== -1) {
        result.platform = 'Firefox';
        // Extract Firefox version
        const firefoxVersion = userAgent.match(/Firefox\/(\d+\.\d+)/);
        if (firefoxVersion && firefoxVersion[1]) {
          result.version = firefoxVersion[1];
        }
      } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
        result.platform = 'Safari';
        // Extract Safari version
        const safariVersion = userAgent.match(/Version\/(\d+\.\d+)/);
        if (safariVersion && safariVersion[1]) {
          result.version = safariVersion[1];
        }
      } else if (userAgent.indexOf('Edge') !== -1 || userAgent.indexOf('Edg/') !== -1) {
        result.platform = 'Edge';
        // Extract Edge version
        const edgeVersion = userAgent.match(/Edge\/(\d+\.\d+)/) || userAgent.match(/Edg\/(\d+\.\d+)/);
        if (edgeVersion && edgeVersion[1]) {
          result.version = edgeVersion[1];
        }
      } else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1) {
        result.platform = 'Internet Explorer';
        // Extract IE version
        const ieVersion = userAgent.match(/MSIE (\d+\.\d+)/) || userAgent.match(/rv:(\d+\.\d+)/);
        if (ieVersion && ieVersion[1]) {
          result.version = ieVersion[1];
        }
      } else if (userAgent.indexOf('Opera') !== -1 || userAgent.indexOf('OPR/') !== -1) {
        result.platform = 'Opera';
        // Extract Opera version
        const operaVersion = userAgent.match(/Opera\/(\d+\.\d+)/) || userAgent.match(/OPR\/(\d+\.\d+)/);
        if (operaVersion && operaVersion[1]) {
          result.version = operaVersion[1];
        }
      } else {
        result.platform = 'Unknown';
      }
      
      // Set model to empty string as requested
      result.model = '';
    }
    
    return result;
  }
}
