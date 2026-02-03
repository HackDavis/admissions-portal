'use server';

const TITO_API_TOKEN = process.env.TITO_API_TOKEN;
const TITO_ACCOUNT_SLUG = process.env.TITO_ACCOUNT_SLUG;
const TITO_EVENT_SLUG = process.env.TITO_EVENT_SLUG;

interface RsvpList {
  id: string;
  slug: string;
  title: string;
  release_ids?: number[];
  question_ids?: number[];
  activity_ids?: number[];
}

interface Response {
  ok: boolean;
  body: RsvpList[] | null;
  error: string | null;
}

export default async function getRsvpLists(): Promise<Response> {
  try {
    if (!TITO_API_TOKEN || !TITO_ACCOUNT_SLUG || !TITO_EVENT_SLUG) {
      const error = 'Missing Tito API configuration in environment variables';
      console.error('[Tito API] getRsvpLists:', error);
      throw new Error(error);
    }

    const url = `https://api.tito.io/v3/${TITO_ACCOUNT_SLUG}/${TITO_EVENT_SLUG}/rsvp_lists`;

    console.log('[Tito API] Fetching RSVP lists from:', url);

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
      console.error('[Tito API] getRsvpLists failed:', errorMsg);
      console.error('[Tito API] Request URL:', url);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const rsvpLists = data.rsvp_lists || [];

    console.log('[Tito API] Successfully fetched', rsvpLists.length, 'RSVP lists');

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
