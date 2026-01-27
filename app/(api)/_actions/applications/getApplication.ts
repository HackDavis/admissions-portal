'use server';
import { auth } from '@/auth';
import {
  // GetApplication,
  GetManyApplications,
} from '@datalib/applications/getApplication';

// Uncomment if needed:
// export async function getApplication(id: string) {
//   const res = await GetApplication(id);
//   return JSON.parse(JSON.stringify(res));
// }

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
