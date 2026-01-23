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
        setError(res.error ?? 'Submission failed');
        setLoading(false);
        return false;
      }

      setLoading(false);
      console.log('Application submitted successfully');
      return true;
    } catch (err: any) {
      setError('An unexpected error occurred during submission.');
      setLoading(false);
      return false;
    }
  };

  return { submit, loading, error };
}
