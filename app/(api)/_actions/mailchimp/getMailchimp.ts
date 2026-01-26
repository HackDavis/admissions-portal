'use server';
import { GetMailchimp } from '@datalib/mailchimp/getMailchimp';

export async function getMailchimp() {
  const res = await GetMailchimp();
  return JSON.parse(JSON.stringify(res));
}
