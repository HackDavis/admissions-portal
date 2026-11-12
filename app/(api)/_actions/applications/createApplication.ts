'use server';

import { CreateApplication } from '@datalib/applications/createApplication';
import { revalidatePath } from 'next/cache';
import { GetRollout, GetRollback } from '@datalib/applications/getRollout';

export async function createApplication(body: object) {
  const start_date = await GetRollout('applications');
  const end_date = await GetRollback('applications');

  if (
    start_date.body == null ||
    end_date.body == null ||
    Date.now() < start_date.body ||
    Date.now() > end_date.body
  ) {
    return {
      ok: false,
      body: null,
      error: "Timeframe to submit applications is over.",
    };
  }

  const res = await CreateApplication(body);
  revalidatePath('/admin', 'layout');
  return res;
}
