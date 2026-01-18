'use client';

import { useState } from 'react';
import { getManyApplications } from '@actions/applications/getApplication';

export function useCheckEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEmail = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getManyApplications({ email: email.toLowerCase() });

      if (!result.ok) {
        setError(result.error ?? 'Error checking email.');
        setLoading(false);
        return false;
      }

      if (result.body && result.body.length > 0) {
        setError('You have already submitted an application with this email.');
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    } catch (e) {
      setError('Something went wrong while checking your email.');
      setLoading(false);
      return false;
    }
  };

  return { checkEmail, loading, error };
}
