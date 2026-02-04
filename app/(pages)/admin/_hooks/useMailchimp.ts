'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMailchimp } from '@actions/mailchimp/getMailchimp';
import { Mailchimp } from '@/app/_types/mailchimp';

export function useMailchimp() {
  const [mailchimp, setMailchimp] = useState<Mailchimp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    const res = await getMailchimp();
    if (res.ok) {
      setMailchimp(res.body);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { mailchimp, loading, refresh };
}
