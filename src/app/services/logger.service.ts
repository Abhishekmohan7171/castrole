import { Injectable, isDevMode } from '@angular/core';

/**
 * Logger service that gates console output by environment.
 * Only logs in development mode, suppresses in production.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly isDev = isDevMode();

  log(...args: any[]): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  }

  info(...args: any[]): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  }
}
