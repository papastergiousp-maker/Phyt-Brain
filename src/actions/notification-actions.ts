
'use server';

import type { Client } from '@/lib/types';

interface SendNotificationEmailParams {
  recipients: Client[];
  message: string;
}

/**
 * This server action simulates sending an email notification to a list of clients.
 * In a real application, this function would integrate with an email service
 * like SendGrid, Mailgun, or Firebase Extensions for email.
 *
 * @param {SendNotificationEmailParams} params - The recipients and message to send.
 * @returns {Promise<{success: boolean; sentCount: number; error?: string}>}
 */
export async function sendNotificationEmail(params: SendNotificationEmailParams): Promise<{ success: boolean; sentCount: number; error?: string }> {
  const { recipients, message } = params;

  if (!recipients || recipients.length === 0) {
    return { success: false, sentCount: 0, error: 'No recipients were provided.' };
  }

  const validRecipients = recipients.filter(r => r.email && r.email.includes('@'));

  if (validRecipients.length === 0) {
    return { success: false, sentCount: 0, error: 'No recipients with a valid email address were found.' };
  }

  try {
    // --- SIMULATION: In a real app, this is where you'd call the email service ---
    console.log('--- SIMULATING EMAIL NOTIFICATION ---');
    console.log(`From: info@phytai.com`);
    console.log('Recipients:', validRecipients.map(r => `${r.name} <${r.email}>`).join(', '));
    console.log('Subject: Ειδοποίηση από τον γεωπόνο σας');
    console.log('Message Body:');
    console.log(message);
    console.log('------------------------------------');

    // Here, you would loop through `validRecipients` and use your email provider's SDK
    // For example, with Nodemailer or SendGrid:
    // for (const recipient of validRecipients) {
    //   await emailProvider.send({
    //     to: recipient.email,
    //     from: 'info@phytai.com',
    //     subject: 'Ειδοποίηση από τον γεωπόνο σας',
    //     html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
    //   });
    // }
    // --- END SIMULATION ---
    
    return { success: true, sentCount: validRecipients.length };

  } catch (error: any) {
    console.error('Error in sendNotificationEmail action:', error);
    return { success: false, sentCount: 0, error: `Failed to send notifications: ${error.message}` };
  }
}
