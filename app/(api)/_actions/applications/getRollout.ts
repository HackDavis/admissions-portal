'use server';
import { GetRollout, GetRollback } from '@datalib/applications/getRollout';

export async function getRollout(rollout: string): Promise<number> {
  const res = await GetRollout(rollout);
  return res.body != null ? res.body : 0;
}

export async function getRollback(rollback: string): Promise<number> {
  const res = await GetRollback(rollback);
  return res.body != null ? res.body : 0;
}
