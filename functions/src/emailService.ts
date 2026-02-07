import * as nodemailer from 'nodemailer';
import * as functions from 'firebase-functions';

/**
 * Email Service for Account Deletion Notifications
 * Handles confirmation emails and reminder emails
 */

// Create reusable transporter
const getTransporter = () => {
  // Get email config from Firebase Functions config
  // Set via: firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
  const config = functions.config();

  if (!config.email || !config.email.user || !config.email.password) {
    console.warn('Email configuration not found. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

/**
 * Send account deletion confirmation email
 */
export async function sendDeletionConfirmationEmail(
  email: string,
  name: string,
  deletionDate: Date
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Skipping email - transporter not configured');
    return;
  }

  const formattedDate = deletionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mailOptions = {
    from: 'Castrole <noreply@castrole.com>',
    to: email,
    subject: 'Account Deletion Scheduled - Castrole',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .info-box { background: white; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Account Deletion Scheduled</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>

          <p>We've received your request to delete your Castrole account. Your account is scheduled for permanent deletion on <strong>${formattedDate}</strong>.</p>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #8b5cf6;">What happens now?</h3>
            <ul>
              <li>Your profile has been hidden from search and discovery</li>
              <li>You've been logged out from all devices</li>
              <li>You have <strong>30 days</strong> to change your mind</li>
              <li>All your data remains intact during this grace period</li>
            </ul>
          </div>

          <div class="warning">
            <h3 style="margin-top: 0; color: #d97706;">Changed your mind?</h3>
            <p style="margin-bottom: 0;">Simply log in to your account within the next 30 days, and you'll be able to reactivate your account with all your data intact.</p>
          </div>

          <div style="text-align: center;">
            <a href="https://castrole.com/auth/login" class="button">
              Reactivate My Account
            </a>
          </div>

          <p style="margin-top: 30px;">If you didn't request this deletion, please contact us immediately at <a href="mailto:support@castrole.com">support@castrole.com</a></p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Castrole. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Deletion confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending deletion confirmation email:', error);
    throw error;
  }
}

/**
 * Send deletion reminder email (7 days or 1 day before deletion)
 */
export async function sendDeletionReminderEmail(
  email: string,
  name: string,
  daysRemaining: number,
  deletionDate: Date
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('Skipping email - transporter not configured');
    return;
  }

  const formattedDate = deletionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const urgencyColor = daysRemaining === 1 ? '#ef4444' : '#f59e0b';

  const mailOptions = {
    from: 'Castrole <noreply@castrole.com>',
    to: email,
    subject: `⚠️ Account deletion in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} - Castrole`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .alert { background: #fef2f2; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .alert h3 { color: ${urgencyColor}; margin-top: 0; }
          .countdown { background: white; border: 2px solid ${urgencyColor}; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .countdown .days { font-size: 48px; font-weight: bold; color: ${urgencyColor}; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">⚠️ Reminder: Account Deletion Soon</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>

          <div class="countdown">
            <div class="days">${daysRemaining}</div>
            <div>day${daysRemaining > 1 ? 's' : ''} remaining</div>
          </div>

          <div class="alert">
            <h3>Your account will be permanently deleted on ${formattedDate}</h3>
            <p><strong>⚠️ After this date, all your data will be permanently deleted and cannot be recovered.</strong></p>
            <p>This includes:</p>
            <ul>
              <li>Your profile and all personal information</li>
              <li>All media files (images, videos, voice intros)</li>
              <li>Chat history and conversations</li>
              <li>Analytics and activity data</li>
            </ul>
          </div>

          <h3 style="color: #8b5cf6;">Still want to keep your account?</h3>
          <p>You can reactivate your account by simply logging in:</p>

          <div style="text-align: center;">
            <a href="https://castrole.com/auth/login" class="button">
              Reactivate My Account Now
            </a>
          </div>

          <p style="margin-top: 30px; padding: 15px; background: #e0e7ff; border-radius: 4px; font-size: 14px;">
            <strong>Note:</strong> If you want to proceed with deletion, no action is needed. Your account will be automatically deleted on the scheduled date.
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Castrole. All rights reserved.</p>
          <p>This is an automated reminder. If you have questions, contact us at support@castrole.com</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Deletion reminder (${daysRemaining} days) sent to ${email}`);
  } catch (error) {
    console.error('Error sending deletion reminder email:', error);
    throw error;
  }
}
