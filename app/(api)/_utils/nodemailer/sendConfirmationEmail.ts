'use server';

import nodemailer from 'nodemailer';

export async function sendConfirmationEmail(formData: {
  firstName: string;
  email: string;
}): Promise<boolean> {
  const SENDER_EMAIL = process.env.SENDER_EMAIL;
  const SENDER_PWD = process.env.SENDER_PWD;

  // Validate environment variables
  if (!SENDER_EMAIL || !SENDER_PWD) {
    const missingVars: string[] = [];
    if (!SENDER_EMAIL) missingVars.push('SENDER_EMAIL');
    if (!SENDER_PWD) missingVars.push('SENDER_PWD');
    console.error('Missing Environment Variable(s):', missingVars.join(', '));
    return false;
  }

  try {
    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PWD,
      },
    });

    // Email options
    const mailOptions = {
      from: SENDER_EMAIL,
      to: formData.email,
      subject: 'Thank you for filling out HackDavis 2026: Hacker Application',
      text: `Hi ${formData.firstName || 'Applicant'},

Thank you for applying to Hackdavis 2026!
Please note that your participation is not yet confirmed. We'll be in touch soon with more details, updates, and important information as the event approaches.

Warmly,
HackDavis 2026 Team`,
      html: `
        <p>Hi ${formData.firstName || 'Applicant'},</p>

        <p>Thank you for applying to Hackdavis 2026!<br>
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
