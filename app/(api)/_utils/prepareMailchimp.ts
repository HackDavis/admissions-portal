import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';

dotenv.config();

// Env
const {
  MONGODB_URI,
  MONGODB_DB,
  MONGODB_COLLECTION,
  TITO_AUTH_TOKEN,
  TITO_EVENT_BASE_URL,
  MAILCHIMP_API_KEY,
  MAILCHIMP_SERVER_PREFIX,
  MAILCHIMP_LIST_ID,
  HACKDAVIS_HUB_BASE_URL,
  HUB_ADMIN_EMAIL,
  HUB_ADMIN_PASSWORD,
} = process.env;

// Mailchimp axios client
const mailchimp = axios.create({
  baseURL: `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`,
  headers: {
    Authorization: `Basic ${Buffer.from(
      `anystring:${MAILCHIMP_API_KEY}`
    ).toString('base64')}`,
  },
});

// Connect to MongoDB and update applicant status
async function updateApplicant(email: string) {
  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db(MONGODB_DB);
  const collection = db.collection(MONGODB_COLLECTION!);

  // Set status to "accepted" and record acceptance timestamp for the matching email
  await collection.updateOne(
    { email },
    { $set: { status: 'accepted', acceptedAt: new Date() } }
  );

  await client.close();
}

// HackDavis Hub axios client
const session = axios.create();
let hubLoggedIn = false;

// Login to Hub to start authenticated session
async function loginHub() {
  if (!HACKDAVIS_HUB_BASE_URL) return false;
  try {
    const res = await session.post(`${HACKDAVIS_HUB_BASE_URL}/api/auth/login`, {
      email: HUB_ADMIN_EMAIL,
      password: HUB_ADMIN_PASSWORD,
    });
    hubLoggedIn = res.status === 200;
    console.log('Hub login status:', hubLoggedIn, res.data);
  } catch (err) {
    console.error('Hub login failed:', err);
  }
}

// Create hacker invite link
async function createHubInvite(first: string, last: string, email: string) {
  if (!hubLoggedIn) return null;

  try {
    const res = await session.post(`${HACKDAVIS_HUB_BASE_URL}/api/invite`, {
      data: { email, name: `${first} ${last}`, role: 'hacker' },
    });

    console.log('Hub invite response for', email, res.data);

    if (res.data.ok && res.data.body) {
      let path = res.data.body;

      // Remove 'undefined' at the start
      path = path.replace(/^undefined/, '');

      // Remove '&null' at the end
      path = path.replace(/&null$/, '');

      // Ensure it starts with a slash
      if (!path.startsWith('/')) path = '/' + path;

      // Prepend base URL
      return `${HACKDAVIS_HUB_BASE_URL}${path}`;
    }
  } catch (err) {
    console.error('Hub invite failed for', email, err);
  }

  return null;
}

// Mailchimp add/update contact
async function addToMailchimp(
  email: string,
  first: string,
  last: string,
  titoUrl: string,
  hubUrl: string | null
) {
  const subscriberHash = crypto
    .createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');

  // Make sure hubUrl is always a valid URL
  const fullHubUrl = hubUrl
    ? hubUrl.startsWith('http')
      ? hubUrl
      : `${HACKDAVIS_HUB_BASE_URL}${hubUrl}`
    : '';

  const payload = {
    email_address: email,
    status: 'subscribed', // force update for all existing subscribers
    merge_fields: {
      FNAME: first,
      LNAME: last,
      TITOURL: titoUrl,
      HUBURL: fullHubUrl,
    },
  };

  // Log what we are sending for testing
  console.log('Sending to Mailchimp:', payload);

  try {
    const res = await mailchimp.put(
      `/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      payload
    );
    console.log(`Mailchimp updated for ${email}:`, res.data.merge_fields);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        `❌ Failed to update Mailchimp for ${email}:`,
        err.response?.data ?? err.message
      );
    } else {
      console.error(`❌ Failed to update Mailchimp for ${email}:`, err);
    }
    return null;
  }
}

// Fetch from Tito
async function getRsvpList() {
  const res = await axios.get(`${TITO_EVENT_BASE_URL}/rsvp_lists`, {
    headers: { Authorization: `Token token=${TITO_AUTH_TOKEN}` },
  });
  return res.data.rsvp_lists[0];
}

async function fetchInvites(slug: string) {
  const res = await axios.get(
    `${TITO_EVENT_BASE_URL}/rsvp_lists/${slug}/release_invitations`,
    {
      headers: { Authorization: `Token token=${TITO_AUTH_TOKEN}` },
    }
  );
  return res.data.release_invitations.filter((x: any) => !x.redeemed);
}

// Main
async function main() {
  console.log('Processing Tito → Hub → Mailchimp\n');

  const rsvpList = await getRsvpList();
  const invites = await fetchInvites(rsvpList.slug);
  await loginHub();

  for (const inv of invites) {
    console.log(`\nProcessing: ${inv.email}`);
    console.log('Tito invite object:', inv);

    // Create Hub invite
    const hubUrl = await createHubInvite(
      inv.first_name,
      inv.last_name,
      inv.email
    );
    console.log('Hub URL to send to Mailchimp:', hubUrl);

    // Add/update Mailchimp
    await addToMailchimp(
      inv.email,
      inv.first_name,
      inv.last_name,
      inv.unique_url,
      hubUrl
    );

    // Update MongoDB
    await updateApplicant(inv.email);

    console.log(`✅ Completed for ${inv.email}`);
    await new Promise((r) => setTimeout(r, 400)); // slight delay
  }

  console.log('\nDone. Check Mailchimp UI for updated merge fields!');
}

main().catch((err) => console.error('Main process failed:', err));
