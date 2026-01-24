import emailjs from '@emailjs/browser';

export async function sendConfirmationEmail(formData: {
  firstName: string;
  email: string;
}) {
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

  const templateParams = {
    to_email: formData.email, // recipient email
    to_name: formData.firstName || 'Applicant', // recipient name
    message: `Hi ${formData.firstName || 'Applicant'},

    Thank you for applying to Hackdavis 2026!
    Please note that your participation is not yet confirmed. We'll be in touch soon with more details, updates, and important information as the event approaches.
    
    Warmly,
    HackDavis 2026 Team`,
  };

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    console.log('Email sent successfully:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}
