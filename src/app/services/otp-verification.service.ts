import { Injectable, signal } from '@angular/core';

export interface VerificationStatus {
  phoneNumber: string;
  isVerified: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OtpVerificationService {
  // Signal to track verification status by phone number
  private verificationStatusMap = signal<Map<string, VerificationStatus>>(new Map());

  /** Mark a phone number as verified */
  markAsVerified(phoneNumber: string): void {
    console.log('OtpVerificationService: Marking as verified:', phoneNumber);
    const currentMap = new Map(this.verificationStatusMap());
    currentMap.set(phoneNumber, {
      phoneNumber,
      isVerified: true,
      timestamp: new Date()
    });
    this.verificationStatusMap.set(currentMap);
    console.log('OtpVerificationService: Current verification map:', currentMap);
    console.log('OtpVerificationService: Signal value after update:', this.verificationStatusMap());
  }

  /** Check if a phone number is verified */
  isPhoneVerified(phoneNumber: string): boolean {
    console.log('OtpVerificationService: Checking verification for:', phoneNumber);
    const status = this.verificationStatusMap().get(phoneNumber);
    const isVerified = status?.isVerified ?? false;
    console.log('OtpVerificationService: Found status:', status, 'isVerified:', isVerified);
    return isVerified;
  }

  /** Get verification status for a phone number */
  getVerificationStatus(phoneNumber: string): VerificationStatus | null {
    return this.verificationStatusMap().get(phoneNumber) ?? null;
  }

  /** Clear verification status (useful for logout/cleanup) */
  clearVerificationStatus(phoneNumber?: string): void {
    if (phoneNumber) {
      const currentMap = new Map(this.verificationStatusMap());
      currentMap.delete(phoneNumber);
      this.verificationStatusMap.set(currentMap);
    } else {
      // Clear all
      this.verificationStatusMap.set(new Map());
    }
  }

  /** Get the verification status signal (reactive) */
  getVerificationSignal() {
    return this.verificationStatusMap.asReadonly();
  }
}