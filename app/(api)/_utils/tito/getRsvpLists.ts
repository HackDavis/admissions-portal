'use server';

import { RsvpList, TitoResponse } from '@/app/_types/tito';

const TITO_AUTH_TOKEN = process.env.TITO_AUTH_TOKEN;
const TITO_EVENT_BASE_URL = process.env.TITO_EVENT_BASE_URL;

export default async function getRsvpLists(): Promise<
  TitoResponse<RsvpList[]>
> {
  try {
    if (!TITO_AUTH_TOKEN || !TITO_EVENT_BASE_URL) {
      const error = 'Missing Tito API configuration in environment variables';
      console.error('[Tito API] getRsvpLists:', error);
      throw new Error(error);
    }

    const url = `${TITO_EVENT_BASE_URL}/rsvp_lists`;

    console.log('[Tito API] Fetching RSVP lists from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Token token=${TITO_AUTH_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Tito API error: ${response.status} - ${errorText}`;
      console.error('[Tito API] getRsvpLists failed:', errorMsg);
      console.error('[Tito API] Request URL:', url);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const rsvpLists = data.rsvp_lists || [];

    console.log(
      '[Tito API] Successfully fetched',
      rsvpLists.length,
      'RSVP lists'
    );

    return {
      ok: true,
      body: rsvpLists,
      error: null,
    };
  } catch (e) {
    const error = e as Error;
    console.error('[Tito API] getRsvpLists exception:', error);
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
}
