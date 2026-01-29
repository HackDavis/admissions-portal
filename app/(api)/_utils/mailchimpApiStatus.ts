import { getMailchimp } from '@actions/mailchimp/getMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';

export async function getMailchimpAPIKey() {
  const res = await getMailchimp();
  if (!res.ok) {
    throw new Error(res.error || 'Failed to fetch Mailchimp API status');
  }
  return res.body.apiKeyIndex;
}

export async function checkMailchimpAPILimitAndIncrement() {
  let wasAtLimit = false;
  const res = await getMailchimp();
  if (!res.ok) {
    throw new Error(res.error || 'Failed to fetch Mailchimp API status');
  }
  if (res.body.apiCallsMade >= res.body.maxApiCalls) {
    await incrementMailchimpAPIKey();
    await resetMailchimpAPICalls();
    wasAtLimit = true;
  }
  await updateMailchimp({ apiCallsMade: 1, lastUpdate: new Date() }); // increment api calls by 1
  return wasAtLimit;
}

async function incrementMailchimpAPIKey() {
  await updateMailchimp({ apiKeyIndex: 1, lastUpdate: new Date() }); // increment api key by 1
}

async function resetMailchimpAPICalls() {
  await updateMailchimp({ apiCallsMade: 0, lastReset: new Date() }); // reset api calls to 0
}
