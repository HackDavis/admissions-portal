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
import { getManyApplications } from '@actions/applications/getApplication';
import { updateApplication } from '@actions/applications/updateApplication';

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

        //action call to get applications
        const res = await getManyApplications({ phase, ucd, status });

        if (!cancelled) {
          if (res.ok && Array.isArray(res.body)) {
            setAppsByPhase((p) => ({ ...p, [phase]: res.body }));
          } else {
            setError(res.error ?? `Failed to load ${phase} applications`);
            setAppsByPhase((p) => ({ ...p, [phase]: [] }));
          }
        }
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
  }, [loadPhase, ucd]);

  useEffect(() => {
    loadPhase('tentative');
  }, [loadPhase, ucd, tentativeStatus]);

  useEffect(() => {
    loadPhase('processed');
  }, [loadPhase, ucd, processedStatus]);

  const updateApplicantStatus = useCallback(
    async (
      appId: string,
      nextStatus: Status,
      fromPhase: Phase,
      options?: { wasWaitlisted?: boolean; refreshPhase?: Phase }
    ) => {
      setError(null);

      const payload: any = {
        status: nextStatus,
        wasWaitlisted: options?.wasWaitlisted,
      };

      // Add timestamps based on the status
      if (
        [
          'tentatively_accepted',
          'tentatively_rejected',
          'tentatively_waitlisted',
        ].includes(nextStatus)
      ) {
        payload.reviewedAt = new Date().toISOString();
      }
      if (['accepted', 'rejected', 'waitlisted'].includes(nextStatus)) {
        payload.processedAt = new Date().toISOString();
      }

      try {
        const res = await updateApplication(appId, payload);

        if (!res.ok) {
          throw new Error(res.error ?? 'Failed to update applicant');
        }

        const phasesToRefresh = new Set<Phase>([
          fromPhase,
          options?.refreshPhase ?? fromPhase,
        ]);
        await Promise.all(
          [...phasesToRefresh].map((phase) => loadPhase(phase))
        );
      } catch (err: any) {
        setError(err.message);
      }
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
