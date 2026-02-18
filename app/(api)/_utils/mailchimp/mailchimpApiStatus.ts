import { getMailchimp } from '@actions/mailchimp/getMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';

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

/**
 * Reserve API key indices for N applicants in bulk (1 read + 1-3 writes
 * instead of N × 2+ DB round trips).
 *
 * Returns an array of apiKeyIndex values, one per applicant, handling
 * key rotation boundaries when a batch spans across API key limits.
 */
export async function reserveMailchimpAPIKeyIndices(
  count: number
): Promise<number[]> {
  const res = await getMailchimp();
  if (!res.ok) {
    throw new Error(res.error || 'Failed to fetch Mailchimp API status');
  }

  const { apiKeyIndex, apiCallsMade, maxApiCalls, maxApiKeys } = res.body;

  console.log('[Mailchimp Status] Bulk reserve for', count, 'applicants:', {
    apiKeyIndex,
    apiCallsMade,
    maxApiCalls,
    maxApiKeys,
  });

  const assignments: number[] = [];
  let currentKey = apiKeyIndex;
  let currentCalls = apiCallsMade;

  for (let i = 0; i < count; i++) {
    // Check if we need to rotate before this call
    if (currentCalls >= maxApiCalls - 1) {
      const nextKey = currentKey + 1;
      if (nextKey > maxApiKeys) {
        throw new Error(
          'All Mailchimp API keys exhausted, please contact tech lead.'
        );
      }

      const requiredEnvs = [
        `MAILCHIMP_API_KEY_${nextKey}`,
        `MAILCHIMP_SERVER_PREFIX_${nextKey}`,
        `MAILCHIMP_AUDIENCE_ID_${nextKey}`,
      ];
      for (const env of requiredEnvs) {
        if (!process.env[env])
          throw new Error(`Missing Environment Variable: ${env}`);
      }

      currentKey = nextKey;
      currentCalls = 0;
    }

    assignments.push(currentKey);
    currentCalls += 1;
  }

  // Persist final state in one batch of writes
  const keysRotated = currentKey - apiKeyIndex;
  if (keysRotated > 0) {
    await updateMailchimp({ apiKeyIndex: keysRotated, lastUpdate: new Date() });
    // Set calls to the count used on the final key
    const callsOnFinalKey = assignments.filter((k) => k === currentKey).length;
    await updateMailchimp({ apiCallsMade: 0, lastReset: new Date() });
    await updateMailchimp({
      apiCallsMade: callsOnFinalKey,
      lastUpdate: new Date(),
    });
  } else {
    await updateMailchimp({ apiCallsMade: count, lastUpdate: new Date() });
  }

  console.log(
    `[Mailchimp Status] Bulk reserved ${count} slots: key ${apiKeyIndex}→${currentKey}, calls ${apiCallsMade}→${currentCalls}`
  );

  return assignments;
}

async function incrementMailchimpAPIKey() {
  await updateMailchimp({ apiKeyIndex: 1, lastUpdate: new Date() }); // increment api key by 1
}

async function resetMailchimpAPICalls() {
  await updateMailchimp({ apiCallsMade: 0, lastReset: new Date() }); // reset api calls to 0
}
