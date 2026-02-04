'use server';

import axios, { AxiosInstance } from 'axios';

// Login to Hub to start authenticated session
export async function getHubSession(): Promise<AxiosInstance> {
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
export async function createHubInvite(
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
