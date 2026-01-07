'use server';

import { CreateApplication } from '@datalib/applications/createApplication';
import { revalidatePath } from 'next/cache';

export async function createApplication(body: object) {
  const res = await CreateApplication(body);
  revalidatePath('/', 'layout');
  return res;
}
