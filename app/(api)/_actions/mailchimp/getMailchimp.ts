'use server';
import { GetMailchimp } from '@datalib/mailchimp/getMailchimp';
import { auth } from '@/auth';

export async function getMailchimp() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, error: 'Unauthorized' };
  }
  const res = await GetMailchimp();
  return JSON.parse(JSON.stringify(res));
}
