// emailService.ts
import emailjs from '@emailjs/browser';

/**
 * Sends a confirmation email via EmailJS using formData
 * @param formData The full application form data
 */
export async function sendConfirmationEmail(formData: {
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  university?: string;
}) {
  // === Replace these with your EmailJS IDs ===
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

  // --- Map your formData to template params ---
  const templateParams = {
    to_email: formData.email, // recipient email
    to_name: formData.firstName || 'Applicant', // recipient name
    status: formData.status, // optional: show current status
    university: formData.university || '', // optional: include university
    // message: `Hi ${formData.firstName || ""},

    // We have received your application${
    //       formData.university ? ` from ${formData.university}` : ""
    //     }. Your current status is: ${formData.status}.

    // Thank you for applying!`,
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
