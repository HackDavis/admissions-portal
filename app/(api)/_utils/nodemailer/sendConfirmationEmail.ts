'use server';

import { transporter, DEFAULT_SENDER } from './transporter';

export async function sendConfirmationEmail(formData: {
  firstName: string;
  email: string;
}): Promise<boolean> {
  try {
    // Email options
    // Note: text and html versions of the email are included for fallback in case the email client does not support html (HTML ver usually sent)
    const mailOptions = {
      from: DEFAULT_SENDER,
      to: formData.email,
      subject: 'Thank you for filling out HackDavis 2026: Hacker Application',
      text: `Hi ${formData.firstName || 'Applicant'},

Thank you for applying to Hackdavis 2026!
Please note that your participation is not yet confirmed. We'll be in touch soon with more details, updates, and important information as the event approaches.

Warmly,
HackDavis 2026 Team`,
      html: `
        <p>Hi ${formData.firstName || 'Applicant'},</p>

        <p>Thank you for applying to HackDavis 2026!<br>
        Please note that your participation is not yet confirmed. We'll be in touch soon with more details, updates, and important information as the event approaches.</p>

        <p>Warmly,<br>
        HackDavis 2026 Team</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent successfully to ${formData.email}`);
    return true;
  } catch (err) {
    console.error(
      `Failed to send confirmation email to ${formData.email}: ${
        (err as Error).message
      }`
    );
    return false;
  }
}
