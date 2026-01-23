'use server';
import { GetManyApplications } from '@datalib/applications/getApplication';

export async function checkEmailExists(email: string) {
  //Basic validation
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { ok: false, exists: false, error: 'Invalid email format' };
  }

  const res = await GetManyApplications(
    { email: email.toLowerCase().trim() },
    {
      projection: { _id: 1 },
      limit: 1,
    }
  );

  return {
    ok: true,
    exists: (res.body ?? []).length > 0,
  };
}
