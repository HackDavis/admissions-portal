'use client';

import { useEffect, useState } from 'react';
import { getRollout, getRollback } from '@actions/applications/getRollout';

export function GetRolloutTime(rollout: string): number {
  const [result, setResult] = useState<number>(0);

  useEffect(() => {
    async function _getRollout() {
      const number = await getRollout(rollout);
      setResult(number);
    }
    _getRollout();
  }, [rollout]);
  return result;
}

export function GetRollbackTime(rollback: string): number {
  const [result, setResult] = useState<number>(0);

  useEffect(() => {
    async function _getRollout() {
      const number = await getRollback(rollback);
      setResult(number);
    }
    _getRollout();
  }, [rollback]);
  return result;
}
