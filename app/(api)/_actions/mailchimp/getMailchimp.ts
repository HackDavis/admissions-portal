'use server';
import { GetMailchimp } from '@datalib/mailchimp/getMailchimp';

export async function getApplication(id: string) {
  const res = await GetMailchimp(id);
  return JSON.parse(JSON.stringify(res));
}
