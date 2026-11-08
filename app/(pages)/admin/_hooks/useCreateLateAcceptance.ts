import { useState } from 'react';
import { checkEmailExists } from '@actions/applications/checkEmail';
import {
  DUPLICATE_APPLICATION_ERROR,
  LateAcceptanceInput,
  LateAcceptanceResult,
  normalizeEmail,
} from '@app/_utils/lateAcceptance';

// TODO(#121): replace with the createLateAcceptance server action. This stub
// runs a real duplicate lookup but saves nothing.
async function createLateAcceptanceStub(
  input: LateAcceptanceInput
): Promise<LateAcceptanceResult> {
  const email = normalizeEmail(input.email);
  const duplicate = await checkEmailExists(email);
  if (!duplicate.ok)
    return {
      ok: false,
      body: null,
      error: duplicate.error ?? 'Lookup failed.',
    };
  if (duplicate.exists)
    return {
      ok: false,
      body: null,
      error: DUPLICATE_APPLICATION_ERROR,
      fieldErrors: { email: DUPLICATE_APPLICATION_ERROR },
    };

  const now = new Date().toISOString();
  const body = { ...input, _id: 'not-saved', email, status: 'accepted' };
  return {
    ok: true,
    error: null,
    body: { ...body, wasWaitlisted: false, submittedAt: now, reviewedAt: now },
  } as LateAcceptanceResult;
}

export default function useCreateLateAcceptance() {
  const [loading, setLoading] = useState(false);

  async function submit(
    input: LateAcceptanceInput
  ): Promise<LateAcceptanceResult> {
    setLoading(true);
    try {
      return await createLateAcceptanceStub(input);
    } catch (err) {
      console.error('Error creating late acceptance:', err);
      return {
        ok: false,
        body: null,
        error: 'Something went wrong. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading };
}
