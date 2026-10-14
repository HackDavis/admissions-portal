import { useState } from 'react';
import { checkEmailExists } from '@actions/applications/checkEmail';
import { Application } from '@/app/_types/application';
import {
  DUPLICATE_APPLICATION_ERROR,
  LateAcceptanceInput,
  LateAcceptanceResult,
  normalizeEmail,
  validateLateAcceptance,
} from '@app/_utils/lateAcceptance';

// TODO(#121): replace with the createLateAcceptance server action. This stub
// runs the shared validation and a real duplicate lookup but saves nothing.
async function createLateAcceptanceStub(
  input: LateAcceptanceInput
): Promise<LateAcceptanceResult> {
  const fieldErrors = validateLateAcceptance(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      body: null,
      error: 'Fix the highlighted fields.',
      fieldErrors,
    };
  }

  const email = normalizeEmail(input.email);
  const duplicate = await checkEmailExists(email);
  if (!duplicate.ok) {
    return {
      ok: false,
      body: null,
      error: duplicate.error ?? 'Lookup failed.',
    };
  }
  if (duplicate.exists) {
    return {
      ok: false,
      body: null,
      error: DUPLICATE_APPLICATION_ERROR,
      fieldErrors: { email: DUPLICATE_APPLICATION_ERROR },
    };
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    error: null,
    body: {
      ...input,
      _id: 'not-saved',
      email,
      status: 'accepted',
      wasWaitlisted: false,
      submittedAt: now,
      reviewedAt: now,
    } as Application,
  };
}

export default function useCreateLateAcceptance() {
  const [loading, setLoading] = useState(false);

  async function submit(input: LateAcceptanceInput) {
    setLoading(true);
    try {
      return await createLateAcceptanceStub(input);
    } catch (err) {
      console.error('Error creating late acceptance:', err);
      return {
        ok: false,
        body: null,
        error: 'Something went wrong. Please try again.',
      } as LateAcceptanceResult;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading };
}
