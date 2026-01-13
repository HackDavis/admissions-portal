'use server';

import axios from 'axios';
import crypto from 'crypto';

// Mailchimp axios client
const mailchimp = axios.create({
  baseURL: `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`,
  headers: {
    Authorization: `Basic ${Buffer.from(
      `anystring:${process.env.MAILCHIMP_API_KEY}`
    ).toString('base64')}`,
  },
});

// HackDavis Hub axios client
const session = axios.create();
let hubLoggedIn = false;

// Login to Hub to start authenticated session
async function loginHub() {
  if (hubLoggedIn) return;
  try {
    const res = await session.post(
      `${process.env.HACKDAVIS_HUB_BASE_URL}/api/auth/login`,
      {
        email: process.env.HUB_ADMIN_EMAIL,
        password: process.env.HUB_ADMIN_PASSWORD,
      }
    );
    hubLoggedIn = res.status === 200;
    console.log('Hub login status:', hubLoggedIn, res.data);
  } catch (err) {
    console.error('Hub login failed:', err);
  }
}

// Create hacker invite link
async function createHubInvite(
  first: string,
  last: string,
  email: string
): Promise<string> {
  if (!hubLoggedIn) {
    throw new Error('Hub is not logged in');
  }

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
  if (!hubUrl) throw new Error(`Hub URL missing for ${email}`);
  if (!titoUrl) throw new Error(`Tito URL missing for ${email}`);

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
  return res.data.rsvp_lists[0];
}

async function fetchInvites(slug: string) {
  const res = await axios.get(
    `${process.env.TITO_EVENT_BASE_URL}/rsvp_lists/${slug}/release_invitations`,
    {
      headers: { Authorization: `Token token=${process.env.TITO_AUTH_TOKEN}` },
    }
  );
  return res.data.release_invitations.filter((x: any) => !x.redeemed);
}

// Main
export async function prepareMailchimpInvites() {
  console.log('Processing Tito → Hub → Mailchimp\n');

  const rsvpList = await getRsvpList();
  const invites = await fetchInvites(rsvpList.slug);

  if (!invites.length) {
    return { ok: false, message: 'No unredeemed invites found.' };
  }

  await loginHub();

  for (const inv of invites) {
    console.log(`\nProcessing: ${inv.email}`);
    console.log('Tito invite object:', inv);

    try {
      // Create Hub invite
      const hubUrl = await createHubInvite(
        inv.first_name,
        inv.last_name,
        inv.email
      );
      console.log('Hub URL sending to Mailchimp:', hubUrl);

      // 2nd check that hub and tito urls exist
      if (!hubUrl) throw new Error(`Hub URL invalid for ${inv.email}`);
      if (!inv.unique_url) throw new Error(`Tito URL missing for ${inv.email}`);

      // Add/update Mailchimp
      await addToMailchimp(
        inv.email,
        inv.first_name,
        inv.last_name,
        inv.unique_url,
        hubUrl
      );

      console.log(`Mailchimp email sent for ${inv.email}`);
      await new Promise((r) => setTimeout(r, 400)); // slight delay
    } catch (err: any) {
      console.error('Process stopped due to error:', err.message);
      return { ok: false, message: err.message };
    }
  }

  console.log('\nDone. Check Mailchimp UI for updated merge fields!');
  return {
    ok: true,
    count: invites.length,
  };
}
