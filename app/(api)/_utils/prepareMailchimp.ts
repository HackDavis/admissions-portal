'use server';

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

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
  hubUrl: string
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
      TITOURL: titoUrl,
      HUBURL: hubUrl,
    },
  };

  // Log what we are sending for testing
  console.log('Sending to Mailchimp:', payload);

  try {
    const res = await mailchimp.put(
      `/lists/${process.env.MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
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
export async function prepareMailchimpInvites() {
  try {
    const requiredEnvs = [
      'MAILCHIMP_API_KEY',
      'MAILCHIMP_SERVER_PREFIX',
      'MAILCHIMP_LIST_ID',
      'TITO_AUTH_TOKEN',
    ];
    for (const env of requiredEnvs) {
      if (!process.env[env])
        throw new Error(`Missing Environment Variable: ${env}`);
    }

    console.log('Processing Tito → Hub → Mailchimp\n');

    const rsvpList = await getRsvpList();
    const invites = await fetchInvites(rsvpList.slug);

    if (!invites.length) {
      return { ok: false, message: 'No unredeemed invites found.' };
    }

    const hubSession = await getHubSession();

    for (const inv of invites) {
      console.log(`\nProcessing: ${inv.email}`);
      console.log('Tito invite object:', inv);

      try {
        // Create Hub invite
        const hubUrl = await createHubInvite(
          hubSession,
          inv.first_name,
          inv.last_name,
          inv.email
        );
        console.log('Hub URL sending to Mailchimp:', hubUrl);

        // 2nd check that hub and tito urls exist
        if (!hubUrl) throw new Error(`Hub URL invalid for ${inv.email}`);
        if (!inv.unique_url)
          throw new Error(`Tito URL missing for ${inv.email}`);

        // Add/update Mailchimp
        await addToMailchimp(
          inv.email,
          inv.first_name,
          inv.last_name,
          inv.unique_url,
          hubUrl
        );

        //TODO: add actual sending of Mailchimp email here

        console.log(`Mailchimp email sent for ${inv.email}`);
        await new Promise((r) => setTimeout(r, 400)); // slight delay
      } catch (err: any) {
        console.error('Process stopped due to error:', err.message);
        return { ok: false, message: err.message };
      }
    }

    console.log('Done. Check Mailchimp UI for updated merge fields!');
    return {
      ok: true,
      count: invites.length,
    };
  } catch (err: any) {
    console.error('Server Action Error:', err.response?.data || err.message);
    return { ok: false, error: err.message || 'Internal Server Error' };
  }
}
