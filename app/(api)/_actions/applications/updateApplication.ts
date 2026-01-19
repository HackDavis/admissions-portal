'use server';

import { auth } from '@/auth'; // Adjust path to your auth config
import { UpdateApplication } from '@datalib/applications/updateApplication';
import { revalidatePath } from 'next/cache';

export async function updateApplication(id: string, body: any) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, error: 'Unauthorized' };
  }

  const res = await UpdateApplication(id, body);
  revalidatePath('/admin', 'layout');
  return res;
}
