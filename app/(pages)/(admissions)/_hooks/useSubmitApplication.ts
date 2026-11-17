'use client';

import { useState } from 'react';
import { createApplication } from '@actions/applications/createApplication';
import { sendConfirmationEmail } from '@utils/nodemailer/sendConfirmationEmail';
import { automaticWaitlistReasons } from '../../../_utils/waitlist';
import {
  ApplicationFormData,
  ApplicationSubmissionPayload,
  SubmissionStatus,
  SubmitResult,
} from '../../../_types/application';

// Prep app data
function buildPayload(
  formData: ApplicationFormData
): ApplicationSubmissionPayload {
  const { customUniversity, ...rest } = formData;
  return {
    ...rest,
    university:
      formData.university === 'Other' ? customUniversity : formData.university,
    status: automaticWaitlistReasons(formData).length
      ? 'waitlisted'
      : 'pending',
  };
}

export function useSubmitApplication() {
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    formData: ApplicationFormData
  ): Promise<SubmitResult> => {
    setStatus('loading');
    setError(null);

    try {
      const res = await createApplication(buildPayload(formData));

      if (!res.ok) {
        const message = res.error ?? 'Submission failed';
        setError(message);
        setStatus('error');
        return { ok: false, emailSent: false, error: message };
      }

      let emailSent = false;
      try {
        emailSent = Boolean(
          await sendConfirmationEmail({
            firstName: formData.firstName,
            email: formData.email.trim().toLowerCase(),
          })
        );
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }

      setStatus('success');
      return { ok: true, emailSent, error: null };
    } catch (err) {
      console.error('Error submitting application: ', err);
      const message = 'An unexpected error occurred during submission.';
      setError(message);
      setStatus('error');
      return { ok: false, emailSent: false, error: message };
    }
  };

  return {
    submit,
    status, // 'idle' | 'loading' | 'success' | 'error'
    loading: status === 'loading',
    success: status === 'success',
    error,
  };
}
