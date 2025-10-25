import { Injectable, inject } from '@angular/core';
import { Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@angular/fire/auth';

// Declare grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      reset: (widgetId: number) => void;
      render: (container: string | HTMLElement, parameters?: any) => number;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PhoneAuthService {
  private auth = inject(Auth);
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  // Test phone numbers for development (matching Firebase Console)
  private testPhoneNumbers = new Map([
    ['+917358356139', '123456'],
    ['+916374087443', '123456'],
  ]);

  // Development mode flag
  private isDevelopment = !window.location.hostname.includes('castrole.com');

  /** Initialize reCAPTCHA verifier */
  initializeRecaptcha(containerId: string): void {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  }

  /** Send OTP to phone number */
  async sendOTP(phoneNumber: string): Promise<void> {
    // Check if this is a test number in development
    if (this.isDevelopment && this.testPhoneNumbers.has(phoneNumber)) {
      console.log('Using test phone number in development mode:', phoneNumber);
      // Create a mock confirmation result for test numbers
      this.confirmationResult = {
        confirm: async (code: string) => {
          const expectedCode = this.testPhoneNumbers.get(phoneNumber);
          if (code === expectedCode) {
            // Return a mock user for successful verification
            return {
              user: {
                uid: 'test-user-' + phoneNumber.replace(/\D/g, ''),
                phoneNumber: phoneNumber,
              }
            };
          } else {
            throw new Error('Invalid verification code');
          }
        }
      } as ConfirmationResult;
      return; // Don't actually send SMS for test numbers
    }

    if (!this.recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier not initialized');
    }

    try {
      this.confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier);
      console.log('OTP sent successfully');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      // Reset reCAPTCHA on error
      this.recaptchaVerifier.render().then((widgetId) => {
        window.grecaptcha.reset(widgetId);
      });

      // Provide user-friendly error messages
      let userMessage = 'Failed to send OTP. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-app-credential':
          userMessage = 'Phone authentication is not configured. Please contact support.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many attempts. Please try again later or use a test number: +91 73583 56139';
          break;
        case 'auth/invalid-phone-number':
          userMessage = 'Invalid phone number format. Please check and try again.';
          break;
        case 'auth/quota-exceeded':
          userMessage = 'SMS quota exceeded. Please try again later.';
          break;
        case 'auth/captcha-check-failed':
          userMessage = 'reCAPTCHA verification failed. Please try again.';
          break;
        default:
          if (error.message) {
            userMessage = error.message;
          }
          break;
      }
      
      throw new Error(userMessage);
    }
  }

  /** Verify OTP code */
  async verifyOTP(code: string): Promise<boolean> {
    if (!this.confirmationResult) {
      throw new Error('No OTP confirmation result available');
    }

    try {
      await this.confirmationResult.confirm(code);
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  /** Clean up reCAPTCHA verifier */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  /** Get the current confirmation result */
  getConfirmationResult(): ConfirmationResult | null {
    return this.confirmationResult;
  }
}