import { useState } from 'react';
import { createLateAcceptance } from '@actions/applications/createLateAcceptance';
import {
  LateAcceptanceInput,
  LateAcceptanceResult,
} from '@app/_utils/lateAcceptance';

export default function useCreateLateAcceptance() {
  const [loading, setLoading] = useState(false);

  async function submit(
    input: LateAcceptanceInput
  ): Promise<LateAcceptanceResult> {
    setLoading(true);
    try {
      return await createLateAcceptance(input);
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
