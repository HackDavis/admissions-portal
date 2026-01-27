'use server';
import { auth } from '@/auth';
import { GetManyApplications } from '@datalib/applications/getApplication';

export async function getAdminApplications(
  query: any,
  projection?: Record<string, number>
) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, error: 'Unauthorized' };
  }

  const res = await GetManyApplications(
    query,
    projection ? { projection } : {}
  );
  if (!res.ok) return res;

  const serializedBody = (res.body ?? []).map((app: any) => ({
    ...app,
    _id: String(app._id),
  }));

  return { ok: true, body: serializedBody };
}
