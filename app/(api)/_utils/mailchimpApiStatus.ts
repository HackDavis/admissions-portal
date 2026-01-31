import { getMailchimp } from '@actions/mailchimp/getMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';

export async function getMailchimpAPIKey() {
  const res = await getMailchimp();
  if (!res.ok) {
    throw new Error(res.error || 'Failed to fetch Mailchimp API status');
  }
  return res.body.apiKeyIndex;
}

export async function reserveMailchimpAPIKeyIndex() {
  const res = await getMailchimp();
  if (!res.ok) {
    throw new Error(res.error || 'Failed to fetch Mailchimp API status');
  }

  let currApiKeyIndex = res.body.apiKeyIndex;
  if (currApiKeyIndex > res.body.maxApiKeys) {
    // 1-based index for api keys
    throw new Error(
      'All Mailchimp API keys exhausted, please contact tech lead.'
    );
  }

  if (res.body.apiCallsMade >= res.body.maxApiCalls - 1) {
    // safe buffer of 1 call

    // Confirm environment variables for new api key index
    const requiredEnvs = [
      `MAILCHIMP_API_KEY_${currApiKeyIndex + 1}`,
      `MAILCHIMP_SERVER_PREFIX_${currApiKeyIndex + 1}`,
      `MAILCHIMP_AUDIENCE_ID_${currApiKeyIndex + 1}`,
    ];
    for (const env of requiredEnvs) {
      if (!process.env[env])
        throw new Error(`Missing Environment Variable: ${env}`);
    }

    await incrementMailchimpAPIKey();
    await resetMailchimpAPICalls();
    currApiKeyIndex += 1;
  }
  await updateMailchimp({ apiCallsMade: 1, lastUpdate: new Date() }); // increment api calls by 1
  return currApiKeyIndex;
}

async function incrementMailchimpAPIKey() {
  await updateMailchimp({ apiKeyIndex: 1, lastUpdate: new Date() }); // increment api key by 1
}

async function resetMailchimpAPICalls() {
  await updateMailchimp({ apiCallsMade: 0, lastReset: new Date() }); // reset api calls to 0
}
