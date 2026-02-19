'use client';

import { useCallback, useEffect, useState } from 'react';

import { getStats } from '@actions/applications/getStats';
import { AdminStats } from '@/app/_types/stats';

export default function useStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getStats();
      if (!res.ok || !res.body) {
        setError(res.error ?? 'Failed to load stats');
        setStats(null);
        return;
      }

      setStats(res.body as AdminStats);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Failed to load stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats,
  };
}
