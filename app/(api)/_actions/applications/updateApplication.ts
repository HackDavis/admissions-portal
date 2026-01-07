'use server';

import { UpdateApplication } from '@datalib/applications/updateApplication';
import { revalidatePath } from 'next/cache';

export async function updateApplication(id: string, body: object) {
  const res = await UpdateApplication(id, body);
  revalidatePath('/', 'layout');
  return res;
}
