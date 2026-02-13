import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs.config';
import { LoggerService } from './logger.service';

export interface SupportEmailParams {
  subject: string;
  concern: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: string;
}

@Injectable({ providedIn: 'root' })
export class EmailJsService {
  private readonly logger = new LoggerService();

  constructor() {
    emailjs.init(EMAILJS_CONFIG.publicKey);
  }

  /**
   * Sends a support/feedback email via EmailJS
   * @returns Promise that resolves on success, rejects on failure
   */
  async sendSupportEmail(params: SupportEmailParams): Promise<void> {
    const templateParams = {
      subject: params.subject,
      concern: params.concern,
      user_name: params.userName || 'Not provided',
      user_email: params.userEmail || 'Not provided',
      user_phone: params.userPhone || 'Not provided',
      user_role: params.userRole || 'Not provided',
      to_email: EMAILJS_CONFIG.supportEmail,
    };

    try {
      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );
      this.logger.log('EmailJS: Support email sent successfully', response.status);
    } catch (error) {
      this.logger.error('EmailJS: Failed to send support email', error);
      throw error;
    }
  }
}
