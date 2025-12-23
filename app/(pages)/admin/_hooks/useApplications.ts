'use client';

import { useEffect, useMemo, useState } from 'react';

import { Application, Phase, StatusFilter, UcdParam } from '../_types';
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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading((p) => ({ ...p, unseen: true }));
      try {
        const apps = await fetchApplications({
          phase: 'unseen',
          ucd,
          status: null,
        });
        if (!cancelled) setAppsByPhase((p) => ({ ...p, unseen: apps }));
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message ?? 'Failed to load unseen applications');
      } finally {
        if (!cancelled) setLoading((p) => ({ ...p, unseen: false }));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [ucd]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading((p) => ({ ...p, tentative: true }));
      try {
        const status = tentativeStatus === 'all' ? null : tentativeStatus;
        const apps = await fetchApplications({
          phase: 'tentative',
          ucd,
          status,
        });
        if (!cancelled) setAppsByPhase((p) => ({ ...p, tentative: apps }));
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message ?? 'Failed to load tentative applications');
      } finally {
        if (!cancelled) setLoading((p) => ({ ...p, tentative: false }));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [ucd, tentativeStatus]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading((p) => ({ ...p, processed: true }));
      try {
        const status = processedStatus === 'all' ? null : processedStatus;
        const apps = await fetchApplications({
          phase: 'processed',
          ucd,
          status,
        });
        if (!cancelled) setAppsByPhase((p) => ({ ...p, processed: apps }));
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message ?? 'Failed to load processed applications');
      } finally {
        if (!cancelled) setLoading((p) => ({ ...p, processed: false }));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [ucd, processedStatus]);

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
  };
}
