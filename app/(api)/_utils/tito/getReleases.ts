'use server';

const TITO_API_TOKEN = process.env.TITO_API_TOKEN;
const TITO_ACCOUNT_SLUG = process.env.TITO_ACCOUNT_SLUG;
const TITO_EVENT_SLUG = process.env.TITO_EVENT_SLUG;

interface Release {
  id: string;
  slug: string;
  title: string;
  quantity?: number;
}

interface Response {
  ok: boolean;
  body: Release[] | null;
  error: string | null;
}

export default async function getReleases(): Promise<Response> {
  try {
    if (!TITO_API_TOKEN || !TITO_ACCOUNT_SLUG || !TITO_EVENT_SLUG) {
      const error = 'Missing Tito API configuration in environment variables';
      console.error('[Tito API] getReleases:', error);
      throw new Error(error);
    }

    const url = `https://api.tito.io/v3/${TITO_ACCOUNT_SLUG}/${TITO_EVENT_SLUG}/releases`;

    console.log('[Tito API] Fetching releases from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Token token=${TITO_API_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Tito API error: ${response.status} - ${errorText}`;
      console.error('[Tito API] getReleases failed:', errorMsg);
      console.error('[Tito API] Request URL:', url);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const releases = data.releases || [];

    console.log('[Tito API] Successfully fetched', releases.length, 'releases');
    console.log('[Tito API] Full releases response:', JSON.stringify(data, null, 2));

    return {
      ok: true,
      body: releases,
      error: null,
    };
  } catch (e) {
    const error = e as Error;
    console.error('[Tito API] getReleases exception:', error);
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
}
