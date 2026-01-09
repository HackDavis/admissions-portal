'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Application } from '@/app/_types/application';
import {
  Phase,
  Status,
  StatusFilter,
  UcdStudentFilter,
} from '@/app/_types/applicationFilters';

import { PHASES } from '../_utils/constants';
import {
  getApplications,
  patchApplicationStatus,
} from '../_utils/applications';

export default function useApplications() {
  const [ucd, setUcd] = useState<UcdStudentFilter>('all');
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

        //api call to get applications
        const apps = await getApplications({ phase, ucd, status });
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

      //api call to update status
      await patchApplicationStatus({
        id: appId,
        status: nextStatus,
        wasWaitlisted: options?.wasWaitlisted,
      });

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
