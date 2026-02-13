/**
 * EmailJS Configuration
 * 
 * To set up EmailJS:
 * 1. Create an account at https://www.emailjs.com/
 * 2. Add an email service (e.g., Gmail, Outlook) and get the SERVICE_ID
 * 3. Create an email template with these template variables:
 *    - {{subject}}       → Support ticket subject
 *    - {{concern}}       → Detailed description of the concern
 *    - {{user_name}}     → Name of the user submitting
 *    - {{user_email}}    → Email of the user
 *    - {{user_phone}}    → Phone number of the user
 *    - {{user_role}}     → Role (actor/producer)
 *    - {{to_email}}      → Recipient email (helloworld@yberhood.com)
 * 4. Get the TEMPLATE_ID from the template you created
 * 5. Get the PUBLIC_KEY from Account → API Keys
 * 6. Replace the placeholder values below
 */
export const EMAILJS_CONFIG = {
  serviceId: 'service_x1ggr6b',
  templateId: 'template_5ts6403',
  publicKey: 'qLDAzGKqLuW07WUta',
  supportEmail: 'helloworld@yberhood.com',
} as const;
