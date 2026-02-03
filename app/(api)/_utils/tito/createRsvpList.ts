'use server';

const TITO_API_TOKEN = process.env.TITO_API_TOKEN;
const TITO_ACCOUNT_SLUG = process.env.TITO_ACCOUNT_SLUG;
const TITO_EVENT_SLUG = process.env.TITO_EVENT_SLUG;

interface RsvpList {
  id: string;
  slug: string;
  title: string;
}

interface Response {
  ok: boolean;
  body: RsvpList | null;
  error: string | null;
}

export default async function createRsvpList(title: string): Promise<Response> {
  try {
    if (!TITO_API_TOKEN || !TITO_ACCOUNT_SLUG || !TITO_EVENT_SLUG) {
      const error = 'Missing Tito API configuration in environment variables';
      console.error('[Tito API] createRsvpList:', error);
      throw new Error(error);
    }

    if (!title || title.trim() === '') {
      const error = 'RSVP list title is required';
      console.error('[Tito API] createRsvpList:', error);
      throw new Error(error);
    }

    const url = `https://api.tito.io/v3/${TITO_ACCOUNT_SLUG}/${TITO_EVENT_SLUG}/rsvp_lists`;

    console.log('[Tito API] Creating RSVP list:', title);
    console.log('[Tito API] Request URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token token=${TITO_API_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rsvp_list: {
          title: title.trim(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Tito API error: ${response.status} - ${errorText}`;
      console.error('[Tito API] createRsvpList failed:', errorMsg);
      console.error('[Tito API] Request URL:', url);
      console.error('[Tito API] Request body:', { title: title.trim() });
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const rsvpList = data.rsvp_list;

    console.log('[Tito API] Successfully created RSVP list:', rsvpList);

    return {
      ok: true,
      body: rsvpList,
      error: null,
    };
  } catch (e) {
    const error = e as Error;
    console.error('[Tito API] createRsvpList exception:', error);
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
}
