'use server';

import { auth } from '@/auth';
import { UpdateMailchimp } from '@datalib/mailchimp/updateMailchimp';
import { revalidatePath } from 'next/cache';

export async function updateMailchimp(id: string, body: any) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, error: 'Unauthorized' };
  }

  const res = await UpdateMailchimp(id, body);
  revalidatePath('/admin', 'layout');
  return res;
}
