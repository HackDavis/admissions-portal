'use client';

import { useState } from 'react';
import fetchPost from '@utils/fetch/fetchPost';

export function useSubmitApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: object) => {
    setLoading(true);
    setError(null);

    const res = await fetchPost('/api/applications', payload);
    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(json.error ?? 'Submission failed');
      setLoading(false);
      return false;
    }

    setLoading(false);
    console.log('Application submitted successfully');
    return true;
  };

  return { submit, loading, error };
}
