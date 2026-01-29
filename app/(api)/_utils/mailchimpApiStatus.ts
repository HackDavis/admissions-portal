import { getMailchimp } from '@actions/mailchimp/getMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';

export async function getMailchimpAPIKey() {
  const res = await getMailchimp();
  if (!res.ok) {
    throw new Error(res.error || 'Failed to fetch Mailchimp API status');
  }
  return res.body.apiKeyIndex;
}

export async function checkMailchimpAPILimit() {
  const res = await getMailchimp();
  if (!res.ok) {
    throw new Error(res.error || 'Failed to fetch Mailchimp API status');
  }
  if (res.body.apiCallsMade >= res.body.maxApiCalls) {
    incrementMailchimpAPIKey();
    resetMailchimpAPICalls();
  }
}

async function incrementMailchimpAPIKey() {
  await updateMailchimp({ apiKeyIndex: 1 }); // increment api key by 1
}

async function resetMailchimpAPICalls() {
  await updateMailchimp({ apiCallsMade: 0 }); // reset api calls to 0
}
