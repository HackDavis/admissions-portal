'use server';

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { getApplicationsByStatus } from './exportTito';

interface TitoInvite {
  email: string;
  unique_url: string;
  first_name: string;
  last_name: string;
  redeemed: boolean;
}

// Mailchimp axios client
function getMailchimpClient() {
  return axios.create({
    baseURL: `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`,
    headers: {
      Authorization: `Basic ${Buffer.from(
        `anystring:${process.env.MAILCHIMP_API_KEY}`
      ).toString('base64')}`,
    },
  });
}

// Login to Hub to start authenticated session
async function getHubSession(): Promise<AxiosInstance> {
  const session = axios.create();
  try {
    console.log('Hub login email:', process.env.HUB_ADMIN_EMAIL);
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
  const mailchimp = getMailchimpClient();

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
    tags: [tag],
  };

  // Log what we are sending for testing
  console.log('Sending to Mailchimp:', payload);

  try {
    const res = await mailchimp.put(
      `/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`,
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
  const res = await axios.get(
    `${process.env.TITO_EVENT_BASE_URL}/rsvp_lists/${slug}/release_invitations?page[size]=500`,
    {
      headers: { Authorization: `Token token=${process.env.TITO_AUTH_TOKEN}` },
    }
  );
  return res.data.release_invitations.filter((x: any) => !x.redeemed);
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

  try {
    const requiredEnvs = [
      'MAILCHIMP_API_KEY',
      'MAILCHIMP_SERVER_PREFIX',
      'MAILCHIMP_AUDIENCE_ID',
      'TITO_AUTH_TOKEN',
    ];
    for (const env of requiredEnvs) {
      if (!process.env[env])
        throw new Error(`Missing Environment Variable: ${env}`);
    }

    const dbApplicants = await getApplicationsByStatus(targetStatus);
    if (dbApplicants.length === 0) return { ok: true, ids: [], error: null };

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
          `2026_${statusTemplate}_template` // name of template in mailchimp
        );

        console.log(`Mailchimp email sent for ${app.email}`);
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
          `2026_${statusTemplate}_template` // name of template in mailchimp
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
    console.error('Processing Halted:', err.message);
    // Return what was finished before the crash so the UI can update those specific records
    return {
      ok: false,
      ids: successfulIds,
      error: err.message || 'Internal Server Error',
    };
  }
}
