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

  try {
    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
    );
  } catch (err) {
    return new Error(
      `Failed to send confirmation email to ${formData.email}: ${
        (err as Error).message
      }`
    );
  }
}
