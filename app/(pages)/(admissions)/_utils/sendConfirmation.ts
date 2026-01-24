// EmailJS free only support client-side service
import emailjs from '@emailjs/browser';

export async function sendConfirmationEmail(formData: {
  firstName: string;
  email: string;
}) {
  const templateParams = {
    to_email: formData.email,
    to_name: formData.firstName || 'Applicant',
  };
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  // Explicit check instead of a loop
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('Missing Environment Variable(s)', {
      SERVICE_ID,
      TEMPLATE_ID,
      PUBLIC_KEY,
    });
    return false;
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
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
