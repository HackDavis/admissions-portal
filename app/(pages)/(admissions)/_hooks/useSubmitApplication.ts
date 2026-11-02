'use client';

import { useState } from 'react';
import { createApplication } from '@actions/applications/createApplication';

export function useSubmitApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: object) => {
    setLoading(true);
    setError(null);

    try {
      const res = await createApplication(payload);

      if (!res.ok) {
        const message = res.error ?? 'Submission failed';
        setError(message);
        setLoading(false);
        return { ok: false, error: message };
      }

      setLoading(false);
      console.log('Application submitted successfully');
      return { ok: true, error: null };
    } catch (err: any) {
      const message = 'An unexpected error occurred during submission.';
      setError(message);
      setLoading(false);
      return { ok: false, error: message };
    }
  };

  return { submit, loading, error };
}
