'use server';

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { getApplicationsByStatuses } from './exportTito';
import { reserveMailchimpAPIKeyIndex } from './mailchimpApiStatus';

// Mailchimp axios client
function getMailchimpClient(apiKeyIndex: number) {
  const serverPrefix = process.env[`MAILCHIMP_SERVER_PREFIX_${apiKeyIndex}`];
  const apiKey = process.env[`MAILCHIMP_API_KEY_${apiKeyIndex}`];

  return axios.create({
    baseURL: `https://${serverPrefix}.api.mailchimp.com/3.0`,
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString(
        'base64'
      )}`,
    },
  });
}

// Login to Hub to start authenticated session
async function getHubSession(): Promise<AxiosInstance> {
  const session = axios.create();
  try {
    const res = await session.post(
      `${process.env.HACKDAVIS_HUB_BASE_URL}/api/auth/login`,
      {
        email: process.env.HUB_ADMIN_EMAIL,
        password: process.env.HUB_ADMIN_PASSWORD,
      }
    );
    if (res.status !== 200) throw new Error('Hub login failed');
    return session;
  } catch (err: any) {
    throw new Error(`Hub Authentication Error: ${err.message}`);
  }
}

// Create hacker invite link
async function createHubInvite(
  session: AxiosInstance,
  first: string,
  last: string,
  email: string
): Promise<string> {
  try {
    const res = await session.post(
      `${process.env.HACKDAVIS_HUB_BASE_URL}/api/invite`,
      {
        data: { email, name: `${first} ${last}`, role: 'hacker' },
      }
    );

    console.log('Hub invite response for', email, res.data);

    if (!res.data?.ok || !res.data.body) {
      throw new Error(`Hub invite failed for ${email}`);
    }

    const path = res.data.body;

    // Validate hub invite url
    if (path.startsWith('undefined') || path.endsWith('&null')) {
      throw new Error(`Invalid invite path returned: ${path}`);
    }

    return path;
  } catch (err) {
    console.error('Hub invite failed for', email, err);
    throw err;
  }
}

// Mailchimp add/update contact
async function addToMailchimp(
  mailchimpClient: AxiosInstance,
  audienceId: string,
  email: string,
  first: string,
  last: string,
  titoUrl: string,
  hubUrl: string,
  tag: string
) {
  const subscriberHash = crypto
    .createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');

  const payload = {
    email_address: email,
    status: 'subscribed', // force update for all existing subscribers
    merge_fields: {
      FNAME: first,
      LNAME: last,
      MMERGE7: titoUrl,
      MMERGE8: hubUrl,
    },
    tags: [tag], //TODO: clear pre-existing tags
  };

  // Log what we are sending for testing
  console.log('Sending to Mailchimp:', payload);

  try {
    const res = await mailchimpClient.put(
      `/lists/${audienceId}/members/${subscriberHash}`,
      payload
    );
    console.log(`Mailchimp updated for ${email}:`, res.data.merge_fields);
  } catch (err: any) {
    throw new Error(
      `Failed to update Mailchimp for ${email}: ${
        err.response?.data ?? err.message
      }`
    );
  }
}

// Fetch from Tito
async function getRsvpList() {
  const res = await axios.get(`${process.env.TITO_EVENT_BASE_URL}/rsvp_lists`, {
    headers: { Authorization: `Token token=${process.env.TITO_AUTH_TOKEN}` },
  });
  return res.data.rsvp_lists[0]; //ONLY checks first rsvp list
}

async function fetchInvites(slug: string) {
  const pageSize = 500;
  let page = 1;
  let hasMore = true;
  const inviteMap = new Map<string, string>();

  while (hasMore) {
    const res = await axios.get(
      `${process.env.TITO_EVENT_BASE_URL}/rsvp_lists/${slug}/release_invitations`,
      {
        params: {
          'page[size]': pageSize,
          'page[number]': page,
        },
        headers: {
          Authorization: `Token token=${process.env.TITO_AUTH_TOKEN}`,
        },
      }
    );

    const invites = res.data.release_invitations ?? [];

    for (const invite of invites) {
      if (!invite.redeemed) {
        inviteMap.set(invite.email.toLowerCase(), invite.unique_url);
      } else {
        console.error('Invite already redeemed for', invite.email);
      }
    }

    hasMore = invites.length === pageSize;
    page++;
  }

  return inviteMap;
}

// Main
export async function prepareMailchimpInvites(
  targetStatus:
    | 'tentatively_accepted'
    | 'tentatively_waitlisted'
    | 'tentatively_waitlist_accepted'
    | 'tentatively_waitlist_rejected'
) {
  const requiredEnvs = [
    'TITO_AUTH_TOKEN',
    'TITO_EVENT_BASE_URL',
    'HACKDAVIS_HUB_BASE_URL',
    'HUB_ADMIN_EMAIL',
    'HUB_ADMIN_PASSWORD',
  ];
  for (const env of requiredEnvs) {
    if (!process.env[env])
      throw new Error(`Missing Environment Variable: ${env}`);
  }

  const successfulIds: string[] = [];
  const errorDetails: string[] = [];

  try {
    const dbApplicants = await getApplicationsByStatuses(targetStatus);
    if (dbApplicants.length === 0) return { ok: true, ids: [], error: null };

    const statusTemplate = targetStatus.replace(/^tentatively_/, '');
    const tag = `${statusTemplate}_template`; // name of tag in mailchimp
    const isAccepted =
      targetStatus === 'tentatively_accepted' ||
      targetStatus === 'tentatively_waitlist_accepted';

    let titoInvitesMap = new Map<string, string>();
    let hubSession: AxiosInstance | null = null;

    if (isAccepted) {
      // Get tito and hub for accepted and waitlist_accepted applicants
      console.log('Processing acceptances via Tito → Hub → Mailchimp\n');

      const rsvpList = await getRsvpList();
      [titoInvitesMap, hubSession] = await Promise.all([
        fetchInvites(rsvpList.slug),
        getHubSession(),
      ]);
    }

    const clientCache = new Map<
      number,
      { mailchimpClient: AxiosInstance; audienceId: string }
    >();

    // Pre-fetch api key indices for all applicants
    const applicantsWithKeys = [];
    for (const app of dbApplicants) {
      const apiKeyIndex = await reserveMailchimpAPIKeyIndex();
      applicantsWithKeys.push({ app, apiKeyIndex });
    }

    // Process mailchimp for each applicant
    const results: (string | null)[] = [];
    const CHUNK_SIZE = 10;

    for (let i = 0; i < applicantsWithKeys.length; i += CHUNK_SIZE) {
      const chunk = applicantsWithKeys.slice(i, i + CHUNK_SIZE);

      const chunkResults = await Promise.all(
        chunk.map(async ({ app, apiKeyIndex }) => {
          try {
            // Cache mailchimp clients by api key index
            if (!clientCache.has(apiKeyIndex)) {
              clientCache.set(apiKeyIndex, {
                mailchimpClient: getMailchimpClient(apiKeyIndex),
                audienceId: process.env[
                  `MAILCHIMP_AUDIENCE_ID_${apiKeyIndex}`
                ] as string,
              });
            }
            const { mailchimpClient, audienceId } =
              clientCache.get(apiKeyIndex)!;

            let titoUrl = '';
            let hubUrl = '';
            console.log(`\nProcessing: ${app.email}`);

            if (isAccepted && hubSession) {
              titoUrl = titoInvitesMap.get(app.email.toLowerCase()) || '';
              if (!titoUrl)
                throw new Error(`Tito URL missing for ${app.email}`);

              hubUrl = await createHubInvite(
                hubSession,
                app.firstName,
                app.lastName,
                app.email
              );
              if (!hubUrl)
                throw new Error(`Hub URL generation failed for ${app.email}`);
            }

            await addToMailchimp(
              mailchimpClient,
              audienceId,
              app.email,
              app.firstName,
              app.lastName,
              titoUrl,
              hubUrl,
              tag
            );
            return app._id;
          } catch (err: any) {
            const reason =
              err.response?.data?.detail || err.message || 'Unknown Error';
            const context = `[${app.email}]: ${reason}`;
            console.error(`Failed: ${context}`);
            errorDetails.push(context);
            return null;
          }
        })
      );
      results.push(...chunkResults);
    }

    const finalIds = results.filter((id): id is string => id !== null);
    successfulIds.push(...finalIds);

    const totalRequested = dbApplicants.length;
    const failedCount = totalRequested - finalIds.length;

    console.log('Done. Check Mailchimp UI for updated merge fields!');
    return {
      ok: true,
      ids: successfulIds,
      error:
        failedCount === 0
          ? null
          : `${failedCount} FAILED:\n${errorDetails.join('\n')}`,
    };
  } catch (err: any) {
    return { ok: false, ids: successfulIds, error: err.message };
  }
}
