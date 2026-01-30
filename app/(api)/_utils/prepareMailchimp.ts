'use server';

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { getApplicationsByStatuses } from './exportTito';
import {
  getMailchimpAPIKey,
  reserveMailchimpAPIKeyIndex,
} from './mailchimpApiStatus';

interface TitoInvite {
  email: string;
  unique_url: string;
  first_name: string;
  last_name: string;
  redeemed: boolean;
}

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
    if (
      res.data.body.startsWith('undefined') ||
      res.data.body.endsWith('&null')
    ) {
      throw new Error(`Invalid invite path returned: ${res.data.body}`);
    }

    return path;
  } catch (err) {
    console.error('Hub invite failed for', email, err);
    throw err;
  }
}

// Mailchimp add/update contact
async function addToMailchimp(
  email: string,
  first: string,
  last: string,
  titoUrl: string,
  hubUrl: string,
  tag: string
) {
  const apiKeyIndex = await reserveMailchimpAPIKeyIndex(); //get and update api key if necessary

  // update dynamic api key index
  const mailchimp = getMailchimpClient(apiKeyIndex);
  const audienceId = process.env[`MAILCHIMP_AUDIENCE_ID_${apiKeyIndex}`];

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
    const res = await mailchimp.put(
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
  const unredeemed: TitoInvite[] = [];

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
      if (!invite.redeemed) unredeemed.push(invite);
    }

    hasMore = invites.length === pageSize;
    page++;
  }

  return unredeemed;
}

// Main
export async function prepareMailchimpInvites(
  targetStatus:
    | 'tentatively_accepted'
    | 'tentatively_waitlisted'
    | 'tentatively_waitlist_accepted'
    | 'tentatively_waitlist_rejected'
) {
  const successfulIds: string[] = [];
  const BATCH_LIMITS = {
    tentatively_accepted: 40,
    tentatively_waitlisted: 100,
    tentatively_waitlist_accepted: 40,
    tentatively_waitlist_rejected: 100,
  } as const;
  const limit = BATCH_LIMITS[targetStatus];
  const apiKeyIndex = await getMailchimpAPIKey();

  try {
    const requiredEnvs = [
      `MAILCHIMP_API_KEY_${apiKeyIndex}`,
      `MAILCHIMP_SERVER_PREFIX_${apiKeyIndex}`,
      `MAILCHIMP_AUDIENCE_ID_${apiKeyIndex}`,
      'TITO_AUTH_TOKEN',
    ];
    for (const env of requiredEnvs) {
      if (!process.env[env])
        throw new Error(`Missing Environment Variable: ${env}`);
    }

    const dbApplicants = await getApplicationsByStatuses(targetStatus);
    if (dbApplicants.length === 0) return { ok: true, ids: [], error: null };
    if (dbApplicants.length > limit) {
      throw new Error(
        `${targetStatus} batch too large (${dbApplicants.length}). ` +
          `Limit is ${limit}.`
      );
    }

    /* Handle accepted/waitlisted/rejected applicants */
    if (
      targetStatus === 'tentatively_accepted' ||
      targetStatus === 'tentatively_waitlist_accepted'
    ) {
      // Process accepted or waitlist accepted applicants
      console.log('Processing acceptances via Tito → Hub → Mailchimp\n');

      const rsvpList = await getRsvpList();
      const titoInvites: TitoInvite[] = await fetchInvites(rsvpList.slug);
      const hubSession = await getHubSession();

      for (const app of dbApplicants) {
        console.log(`\nProcessing: ${app.email}`);
        console.log('Tito invite object:', app);

        const titoMatch = titoInvites.find(
          (invite) => invite.email.toLowerCase() === app.email.toLowerCase()
        );
        if (!titoMatch?.unique_url) {
          throw new Error(`Tito URL missing for ${app.email}`);
        }

        // Create Hub invite
        const hubUrl = await createHubInvite(
          hubSession,
          app.firstName,
          app.lastName,
          app.email
        );
        if (!hubUrl)
          throw new Error(`Hub URL generation failed for ${app.email}`);
        console.log('Hub URL sending to Mailchimp:', hubUrl);

        const statusTemplate = targetStatus.replace(/^tentatively_/, '');

        // Add/update Mailchimp
        await addToMailchimp(
          app.email,
          app.firstName,
          app.lastName,
          titoMatch.unique_url,
          hubUrl,
          `${statusTemplate}_template` // name of tag in mailchimp
        );

        console.log(`Mailchimp email prepared for ${app.email}`);
        await new Promise((r) => setTimeout(r, 400)); // slight delay
        successfulIds.push(app._id);
      }
    } else {
      // Process waitlisted and rejected applicants
      console.log(`Processing waitlisted/rejected via Database → Mailchimp\n`);

      for (const app of dbApplicants) {
        const statusTemplate = targetStatus.replace(/^tentatively_/, '');

        await addToMailchimp(
          app.email,
          app.firstName,
          app.lastName,
          '', // No Tito URL
          '', // No Hub URL
          `${statusTemplate}_template` // name of tag in mailchimp
        );
        successfulIds.push(app._id);
      }
    }

    console.log('Done. Check Mailchimp UI for updated merge fields!');
    return {
      ok: true,
      ids: successfulIds,
      error: null,
    };
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message;
    console.error('Processing Halted:', detail);
    // Return what was finished before the crash so the UI can update those specific records
    return {
      ok: false,
      ids: successfulIds,
      error: err.message || 'Internal Server Error',
    };
  }
}
