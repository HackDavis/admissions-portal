// https://github.com/HackDavis/admissions-stuff/blob/main/prepare_mailchimp_input.ipynb
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

dotenv.config();

const TITO_AUTH_TOKEN = process.env.TITO_AUTH_TOKEN!;
const TITO_EVENT_BASE_URL = process.env.TITO_EVENT_BASE_URL!;
const TITO_HEADERS = { Authorization: `Token token=${TITO_AUTH_TOKEN}` };
const HACKDAVIS_HUB_BASE_URL = process.env.HACKDAVIS_HUB_BASE_URL!;
const HUB_LOGIN_PAYLOAD = {
  email: process.env.HUB_ADMIN_EMAIL!,
  password: process.env.HUB_ADMIN_PASSWORD!,
};

// Check if environment variables are loaded
if (
  !HACKDAVIS_HUB_BASE_URL ||
  !HUB_LOGIN_PAYLOAD.email ||
  !HUB_LOGIN_PAYLOAD.password
) {
  console.log('Missing environment variables! Check your .env file');
  console.log(`HUB_BASE_URL: ${HACKDAVIS_HUB_BASE_URL}`);
  console.log(`HUB_EMAIL: ${HUB_LOGIN_PAYLOAD.email}`);
  console.log(
    `HUB_PASSWORD: ${HUB_LOGIN_PAYLOAD.password ? 'SET' : 'NOT SET'}`
  );
  process.exit(1);
}

interface RsvpList {
  title: string;
  slug: string;
}

interface ReleaseInvitation {
  _type?: string;
  id?: string;
  slug?: string;
  name?: string;
  status?: string;
  redeemed: boolean;
  registration_id?: string;
  registration_slug?: string;
  registration_url?: string;
  registration_reference?: string;
  releases?: any;
  unique_url: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface ProcessedInvitation {
  email: string;
  first_name: string;
  last_name: string;
  tito_unique_rsvp_url: string;
  hd_hub_unique_invite_url: string | null;
}

interface HubInviteResponse {
  ok: boolean;
  body: string | null;
  error?: string;
  status?: number;
}

/* HELPER FUNCTIONS */
const session: AxiosInstance = axios.create();

async function getRequestToTito(url: string): Promise<any> {
  const res = await session.get(url, { headers: TITO_HEADERS });
  if (res.data.status && res.data.message) {
    console.log(`Error! ${res.data.status}: ${res.data.message}`);
    process.exit(1);
  }
  return res.data;
}

async function getHdHubInviteUrl(
  row: ProcessedInvitation,
  useMock: boolean = false
): Promise<string | null> {
  // Mock mode - return a placeholder URL
  if (useMock) {
    return `https://hub.hackdavis.io/invite/mock-${Buffer.from(row.email)
      .toString('base64')
      .substring(0, 12)}`;
  }

  const payload = {
    data: {
      email: row.email,
      name: `${row.first_name} ${row.last_name}`,
      role: 'hacker',
    },
  };

  try {
    const hdHubInviteRes = await session.post<HubInviteResponse>(
      `${HACKDAVIS_HUB_BASE_URL}/api/invite`,
      payload
    );

    if (!hdHubInviteRes.data.ok) {
      console.log(
        `Error getting invite URL for ${row.first_name} ${row.last_name}!\n\t${hdHubInviteRes.data.status}: ${hdHubInviteRes.data.error}`
      );
    }
    return hdHubInviteRes.data.body;
  } catch (error) {
    console.log(
      `Error getting invite URL for ${row.first_name} ${row.last_name}!`,
      error
    );
    return null;
  }
}

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(
  rl: readline.Interface,
  question: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function arrayToCsv(data: ProcessedInvitation[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) =>
    Object.values(row)
      .map((val) => `"${val}"`)
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

/* MAIN SCRIPT */
async function main() {
  try {
    const rl = createReadlineInterface();

    // Ask if user wants to use mock data
    const useMockData = await askQuestion(
      rl,
      'Use mock data instead of connecting to Hub? (y/n): '
    );

    let useHub = useMockData.toLowerCase() !== 'y';

    if (useHub) {
      // Try to login to Hub
      try {
        const loginResponse = await session.post(
          `${HACKDAVIS_HUB_BASE_URL}/api/auth/login`,
          HUB_LOGIN_PAYLOAD
        );

        // DEBUG OUTPUT
        console.log(`\nLogin Status Code: ${loginResponse.status}`);
        console.log(`Login Response: ${JSON.stringify(loginResponse.data)}`);
        console.log(`Login URL: ${HACKDAVIS_HUB_BASE_URL}/api/auth/login`);
        console.log(`Payload Email: ${HUB_LOGIN_PAYLOAD.email}`);
        console.log(
          `Payload Password: ${'*'.repeat(
            HUB_LOGIN_PAYLOAD.password?.length || 0
          )}\n`
        );

        if (loginResponse.status !== 200) {
          console.log('Hub login failed. Using mock data instead.\n');
          useHub = false;
        }
      } catch (error: any) {
        console.log(`\nLogin Status Code: ${error.response?.status}`);
        console.log(`Login Response: ${JSON.stringify(error.response?.data)}`);
        console.log(`Login URL: ${HACKDAVIS_HUB_BASE_URL}/api/auth/login`);
        console.log(`Payload Email: ${HUB_LOGIN_PAYLOAD.email}`);
        console.log(
          `Payload Password: ${'*'.repeat(
            HUB_LOGIN_PAYLOAD.password?.length || 0
          )}\n`
        );

        console.log('Error logging in to HackDavis Hub!');
        console.log('\nPossible issues:');
        console.log('1. Check your credentials in .env are correct');
        console.log(
          '2. Try logging in manually at https://hub.hackdavis.io to verify credentials'
        );
        console.log(
          '3. Contact HackDavis Hub administrators about the MongoDB connection error'
        );
        console.log('\nFalling back to mock data mode...\n');
        useHub = false;
      }
    } else {
      console.log(
        '\nUsing mock data mode - Hub invite URLs will be placeholder links.\n'
      );
    }

    console.log(
      `Hello, let's accept some hackers today for the event: ${TITO_EVENT_BASE_URL.split(
        '/'
      ).pop()}!\n`
    );

    // Verify chosen event
    const eventConfirm = await askQuestion(
      rl,
      'Is this the correct event? (y/n): '
    );
    if (eventConfirm.toLowerCase() !== 'y') {
      console.log(
        'If the event name looks incorrect, please check the .env file, change the TITO_EVENT_BASE_URL variable to the correct URL and retry.\n'
      );
      rl.close();
      process.exit(0);
    }

    // Pick an RSVP List
    const rsvpListsRes = await getRequestToTito(
      `${TITO_EVENT_BASE_URL}/rsvp_lists`
    );
    const availableRsvpLists: Record<string, string> = {};

    rsvpListsRes.rsvp_lists.forEach((rsvpList: RsvpList) => {
      availableRsvpLists[rsvpList.title] = rsvpList.slug;
    });

    console.log(
      '\nAvailable RSVP Lists:',
      Object.keys(availableRsvpLists).join(', '),
      '\n'
    );

    const chosenRsvpList = await askQuestion(
      rl,
      'Enter the name of the RSVP List you want to get data for: '
    );
    rl.close();

    const rsvpListSlug = availableRsvpLists[chosenRsvpList];

    // Get Tito Invite URLs
    const rsvpInvitationsRes = await getRequestToTito(
      `${TITO_EVENT_BASE_URL}/rsvp_lists/${rsvpListSlug}/release_invitations?page[size]=500`
    );

    const invitations: ProcessedInvitation[] =
      rsvpInvitationsRes.release_invitations
        .filter((inv: ReleaseInvitation) => !inv.redeemed)
        .map((inv: ReleaseInvitation) => ({
          email: inv.email,
          first_name: inv.first_name,
          last_name: inv.last_name,
          tito_unique_rsvp_url: inv.unique_url,
          hd_hub_unique_invite_url: null,
        }));

    console.log('Done fetching data from Tito!');

    // Get HackDavis Hub Invite URLs
    if (useHub) {
      console.log('Generating real Hub invite URLs...');
      for (const invitation of invitations) {
        invitation.hd_hub_unique_invite_url = await getHdHubInviteUrl(
          invitation,
          false
        );
      }
    } else {
      console.log('Generating mock Hub invite URLs...');
      for (const invitation of invitations) {
        invitation.hd_hub_unique_invite_url = await getHdHubInviteUrl(
          invitation,
          true
        );
      }
    }
    console.log('Done fetching data from HackDavis Hub!');

    console.log(invitations.slice(0, 5));
    console.log(invitations.length);

    // Export to CSV
    const csvContent = arrayToCsv(invitations);
    const fileName = `${chosenRsvpList}_mailchimp_ready_hacker_data.csv`;
    fs.writeFileSync(fileName, csvContent);
    console.log(`All done! Check the ${fileName} file!\n`);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main();
