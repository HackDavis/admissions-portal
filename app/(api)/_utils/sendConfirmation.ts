// EmailJS free only support client-side service
import emailjs from '@emailjs/browser';

export async function sendConfirmationEmail(formData: {
  firstName: string;
  email: string;
}) {
  const templateParams = {
    to_email: formData.email,
    to_name: formData.firstName || 'Applicant',
    message: `Hi ${formData.firstName || 'Applicant'},

    Thank you for applying to HackDavis 2026!
    Please note that your participation is not yet confirmed. We'll be in touch soon with more details, updates, and important information as the event approaches.

    Warmly,
    HackDavis 2026 Team`,
  };

  try {
    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
    );
    console.log('Confirmation email sent successfully');
    return true;
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    return false;
  }
}
