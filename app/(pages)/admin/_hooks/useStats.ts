'use client';

import { useCallback, useEffect, useState } from 'react';

import { getStats } from '@actions/applications/getStats';

type YearDistribution = {
  first: number;
  second: number;
  third: number;
  fourth: number;
  fivePlus: number;
  unknown: number;
};

type FirstTimeHackerCounts = {
  firstTime: number;
  nonFirstTime: number;
  unknown: number;
};

type GenderCounts = {
  women: number;
  men: number;
  transgender: number;
  nonBinary: number;
  preferNotToAnswer: number;
  other: number;
  unknown: number;
};

type MajorCount = {
  major: string;
  count: number;
};

type StemCounts = {
  stem: number;
  nonStem: number;
  unknown: number;
};

type ScopeStats = {
  totalApplicants: number;
  yearDistribution: YearDistribution;
  firstTimeHackers: FirstTimeHackerCounts;
  gender: GenderCounts;
  majorCounts: MajorCount[];
  stemVsNonStem: StemCounts;
};

type AcceptanceRatio = {
  accepted: number;
  rejected: number;
  undecided: number;
  total: number;
};

type PendingWaitlistedCounts = {
  pending: number;
  waitlisted: number;
};

type AdminStats = {
  all: ScopeStats;
  processed: ScopeStats;
  hypothetic: ScopeStats;
  allQueueCounts: PendingWaitlistedCounts;
  acceptanceRatio: {
    processed: AcceptanceRatio;
    hypothetic: AcceptanceRatio;
  };
};

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
      setError(e?.message ?? 'Failed to load stats');
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
