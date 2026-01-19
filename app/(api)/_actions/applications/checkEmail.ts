'use server';
import { GetManyApplications } from '@datalib/applications/getApplication';

export async function checkEmailExists(email: string) {
  return await GetManyApplications(
    { email: email.toLowerCase() },
    {
      projection: { email: 1, status: 1 },
      limit: 1,
    }
  );
}
