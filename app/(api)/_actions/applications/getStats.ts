'use server';

import { auth } from '@/auth';
import { GetApplicationStats } from '@datalib/applications/getStats';

export async function getStats() {
  const session = await auth();

  if (session?.user?.role !== 'admin') {
    return {
      ok: false,
      body: null,
      error: 'Unauthorized',
    };
  }

  const res = await GetApplicationStats();
  if (!res.ok) return res;

  return {
    ok: true,
    body: JSON.parse(JSON.stringify(res.body)),
    error: null,
  };
}
