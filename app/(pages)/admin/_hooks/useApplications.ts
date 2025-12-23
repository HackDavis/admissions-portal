'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Application, Phase, Status, StatusFilter, UcdParam } from '../_types';
import { PHASES } from '../_utils/constants';

async function fetchApplications(params: {
  phase: Phase;
  ucd: UcdParam;
  status?: string | null;
}): Promise<Application[]> {
  const search = new URLSearchParams();
  search.set('phase', params.phase);
  search.set('ucd', params.ucd);
  if (params.status) search.set('status', params.status);

  const res = await fetch(`/applications?${search.toString()}`, {
    method: 'GET',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.applications ?? [];
}

export default function useApplications() {
  const [ucd, setUcd] = useState<UcdParam>('all');
  const [tentativeStatus, setTentativeStatus] = useState<StatusFilter>('all');
  const [processedStatus, setProcessedStatus] = useState<StatusFilter>('all');

  const [loading, setLoading] = useState<Record<Phase, boolean>>({
    unseen: false,
    tentative: false,
    processed: false,
  });

  const [error, setError] = useState<string | null>(null);

  const [appsByPhase, setAppsByPhase] = useState<Record<Phase, Application[]>>({
    unseen: [],
    tentative: [],
    processed: [],
  });

  const getStatusForPhase = useCallback(
    (phase: Phase) => {
      if (phase === 'tentative') {
        return tentativeStatus === 'all' ? null : tentativeStatus;
      }
      if (phase === 'processed') {
        return processedStatus === 'all' ? null : processedStatus;
      }
      return null;
    },
    [processedStatus, tentativeStatus]
  );

  const loadPhase = useCallback(
    async (phase: Phase) => {
      let cancelled = false;
      setError(null);
      setLoading((p) => ({ ...p, [phase]: true }));
      try {
        const status = getStatusForPhase(phase);
        const apps = await fetchApplications({ phase, ucd, status });
        if (!cancelled) setAppsByPhase((p) => ({ ...p, [phase]: apps }));
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? `Failed to load ${phase} applications`);
        }
      } finally {
        if (!cancelled) setLoading((p) => ({ ...p, [phase]: false }));
      }

      return () => {
        cancelled = true;
      };
    },
    [getStatusForPhase, ucd]
  );

  useEffect(() => {
    loadPhase('unseen');
  }, [loadPhase]);

  useEffect(() => {
    loadPhase('tentative');
  }, [loadPhase, tentativeStatus]);

  useEffect(() => {
    loadPhase('processed');
  }, [loadPhase, processedStatus]);

  const updateApplicantStatus = useCallback(
    async (
      appId: string,
      nextStatus: Status,
      fromPhase: Phase,
      options?: { wasWaitlisted?: boolean; refreshPhase?: Phase }
    ) => {
      setError(null);
      const res = await fetch('/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appId,
          status: nextStatus,
          ...(options ?? {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = err?.error ?? `Request failed: ${res.status}`;
        setError(message);
        throw new Error(message);
      }

      const phasesToRefresh = new Set<Phase>([
        fromPhase,
        options?.refreshPhase ?? fromPhase,
      ]);
      await Promise.all([...phasesToRefresh].map((phase) => loadPhase(phase)));
    },
    [loadPhase]
  );

  const totalCount = useMemo(
    () => PHASES.reduce((sum, ph) => sum + appsByPhase[ph.id].length, 0),
    [appsByPhase]
  );

  return {
    appsByPhase,
    error,
    loading,
    processedStatus,
    setProcessedStatus,
    setTentativeStatus,
    setUcd,
    tentativeStatus,
    totalCount,
    ucd,
    updateApplicantStatus,
  };
}
