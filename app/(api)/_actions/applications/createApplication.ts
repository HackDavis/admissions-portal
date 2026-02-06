'use server';

import { CreateApplication } from '@datalib/applications/createApplication';
import { revalidatePath } from 'next/cache';
import { sendConfirmationEmail } from '@utils/sendConfirmationEmail';

export async function createApplication(body: any) {
  const res = await CreateApplication(body);
  revalidatePath('/admin', 'layout');

  // Send confirmation email after successful application submission
  if (res.ok && body.email && body.firstName) {
    try {
      const emailSent = await sendConfirmationEmail({
        firstName: body.firstName,
        email: body.email,
      });

      if (!emailSent) {
        console.error(
          `Failed to send confirmation email to ${body.email}, but application was submitted successfully`
        );
      }
    } catch (err) {
      // Log error but don't fail the application submission
      console.error('Error sending confirmation email:', err);
    }
  }

  return res;
}
