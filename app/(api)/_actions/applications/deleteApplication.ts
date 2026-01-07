'use server';
import { DeleteApplication } from '@datalib/applications/deleteApplication';
import { revalidatePath } from 'next/cache';

export async function deleteApplication(id: string) {
  const res = await DeleteApplication(id);
  revalidatePath('/', 'layout');
  return res;
}
