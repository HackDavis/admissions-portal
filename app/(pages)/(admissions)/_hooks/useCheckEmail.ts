'use client';

import { useState } from 'react';
import fetchGet from '@utils/fetch/fetchGet';

export function useCheckEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEmail = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchGet(
        `/api/applications?email=${encodeURIComponent(email)}`
      );
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Error checking email, please try again.');
        setLoading(false);
        return false;
      }

      if (json.body && json.body.length > 0) {
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
