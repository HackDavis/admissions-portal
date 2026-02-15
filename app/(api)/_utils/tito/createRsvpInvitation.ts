'use server';

const TITO_AUTH_TOKEN = process.env.TITO_AUTH_TOKEN;
const TITO_EVENT_BASE_URL = process.env.TITO_EVENT_BASE_URL;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

interface InvitationData {
  firstName: string;
  lastName: string;
  email: string;
  rsvpListSlug: string;
  releaseIds: string;
  discountCode?: string;
}

interface ReleaseInvitation {
  id: string;
  slug: string;
  email: string;
  first_name: string;
  last_name: string;
  url?: string;
  unique_url?: string;
  created_at: string;
}

interface Response {
  ok: boolean;
  body: ReleaseInvitation | null;
  error: string | null;
}

/** Exported so tests can mock it to avoid real waits. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function createRsvpInvitation(
  data: InvitationData
): Promise<Response> {
  try {
    if (!TITO_AUTH_TOKEN || !TITO_EVENT_BASE_URL) {
      const error = 'Missing Tito API configuration in environment variables';
      console.error('[Tito API] createRsvpInvitation:', error);
      throw new Error(error);
    }

    if (!data.email || data.email.trim() === '') {
      const error = 'Email is required';
      console.error('[Tito API] createRsvpInvitation:', error);
      throw new Error(error);
    }

    if (!data.rsvpListSlug) {
      const error = 'RSVP list slug is required';
      console.error('[Tito API] createRsvpInvitation:', error);
      throw new Error(error);
    }

    if (!data.releaseIds || data.releaseIds.trim() === '') {
      const error = 'Release IDs are required';
      console.error('[Tito API] createRsvpInvitation:', error);
      throw new Error(error);
    }

    // Parse release IDs from comma-separated string to array of numbers
    const releaseIdsArray = data.releaseIds
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (releaseIdsArray.length === 0) {
      const error = 'Invalid release IDs format. Use comma-separated numbers.';
      console.error('[Tito API] createRsvpInvitation:', error);
      throw new Error(error);
    }

    const url = `${TITO_EVENT_BASE_URL}/rsvp_lists/${data.rsvpListSlug}/release_invitations`;

    // Build the request body according to the API documentation
    const requestBody: {
      email: string;
      release_ids: number[];
      first_name?: string;
      last_name?: string;
      discount_code?: string;
    } = {
      email: data.email.trim(),
      release_ids: releaseIdsArray,
    };

    if (data.firstName && data.firstName.trim()) {
      requestBody.first_name = data.firstName.trim();
    }

    if (data.lastName && data.lastName.trim()) {
      requestBody.last_name = data.lastName.trim();
    }

    if (data.discountCode && data.discountCode.trim()) {
      requestBody.discount_code = data.discountCode.trim();
    }

    console.log('[Tito API] Creating release invitation for:', data.email);
    console.log('[Tito API] Request URL:', url);
    console.log('[Tito API] Request body:', requestBody);

    let lastError = '';
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Token token=${TITO_AUTH_TOKEN}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          release_invitation: requestBody,
        }),
      });

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter
          ? parseFloat(retryAfter) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt) +
            Math.random() * BASE_DELAY_MS;

        console.warn(
          `[Tito API] 429 rate-limited for ${
            data.email
          }, retrying in ${Math.round(waitMs)}ms (attempt ${
            attempt + 1
          }/${MAX_RETRIES})`
        );
        await delay(waitMs);
        continue;
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            `Tito API rate limit exceeded after ${MAX_RETRIES} retries for ${data.email}`
          );
        }
        const errorText = await response.text();
        lastError = `Tito API error: ${response.status} - ${errorText}`;
        console.error('[Tito API] createRsvpInvitation failed:', lastError);
        console.error('[Tito API] Request URL:', url);
        console.error('[Tito API] Request body:', requestBody);
        throw new Error(lastError);
      }

      const responseData = await response.json();
      const invitation = responseData.release_invitation;

      if (invitation.unique_url) {
        console.log('[Tito API] Unique invitation URL:', invitation.unique_url);
      }
      if (invitation.url) {
        console.log('[Tito API] Invitation URL:', invitation.url);
      }

      return {
        ok: true,
        body: invitation,
        error: null,
      };
    }

    // All retries exhausted on 429
    throw new Error(
      `Tito API rate limit exceeded after ${MAX_RETRIES} retries for ${data.email}`
    );
  } catch (e) {
    const error = e as Error;
    console.error('[Tito API] createRsvpInvitation exception:', error);
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
}
