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
  const requiredEnvs = [
    'NEXT_PUBLIC_EMAILJS_SERVICE_ID',
    'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID',
    'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY',
  ];

  for (const env of requiredEnvs) {
    if (!process.env[env]) {
      console.error(`Missing Environment Variable(s): ${env}`);
      return false; // don't block submission
    }
  }

  try {
    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
    );
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
