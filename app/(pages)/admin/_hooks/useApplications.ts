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
import { getAdminApplications } from '@actions/applications/getAdminApplications';
import { updateApplication } from '@actions/applications/updateApplication';

import { ApplicationUpdatePayload } from '@/app/_types/application';

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
        const res = await getAdminApplications({ phase, ucd, status });

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

      const payload: ApplicationUpdatePayload = {
        status: nextStatus,
      };

      if (nextStatus === 'waitlisted') {
        payload.wasWaitlisted = true;
      } else if (options?.wasWaitlisted !== undefined) {
        payload.wasWaitlisted = options.wasWaitlisted;
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
