'use server';

import { auth } from '@/auth';
import { UpdateMailchimp } from '@datalib/mailchimp/updateMailchimp';
import { revalidatePath } from 'next/cache';

interface MailchimpPayload {
  apiCallsMade?: number;
  batchNumber?: number;
  apiKeyIndex?: number;
  lastUpdate?: Date | string;
  lastReset?: Date | string;
}

export async function updateMailchimp(body: MailchimpPayload) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, error: 'Unauthorized' };
  }

  const res = await UpdateMailchimp(body);
  revalidatePath('/admin', 'layout');
  return res;
}
