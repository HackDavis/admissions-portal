'use client';

import { useState, useEffect } from 'react';
import { getMailchimp } from '@actions/mailchimp/getMailchimp';

export function useMailchimp() {
  const [mailchimp, setMailchimp] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getMailchimpWrapper = async () => {
      const res = await getMailchimp();
      if (res.ok) {
        setMailchimp(res.body);
      }
      setLoading(false);
    };
    getMailchimpWrapper();
  }, []);

  return { mailchimp, loading };
}
