'use server';

const TITO_API_TOKEN = process.env.TITO_API_TOKEN;
const TITO_ACCOUNT_SLUG = process.env.TITO_ACCOUNT_SLUG;
const TITO_EVENT_SLUG = process.env.TITO_EVENT_SLUG;

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

export default async function createRsvpInvitation(
  data: InvitationData
): Promise<Response> {
  try {
    if (!TITO_API_TOKEN || !TITO_ACCOUNT_SLUG || !TITO_EVENT_SLUG) {
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

    const url = `https://api.tito.io/v3/${TITO_ACCOUNT_SLUG}/${TITO_EVENT_SLUG}/rsvp_lists/${data.rsvpListSlug}/release_invitations`;

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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token token=${TITO_API_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        release_invitation: requestBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Tito API error: ${response.status} - ${errorText}`;
      console.error('[Tito API] createRsvpInvitation failed:', errorMsg);
      console.error('[Tito API] Request URL:', url);
      console.error('[Tito API] Request body:', requestBody);
      throw new Error(errorMsg);
    }

    const responseData = await response.json();
    const invitation = responseData.release_invitation;

    console.log('[Tito API] Successfully created invitation:', invitation);
    console.log('[Tito API] Full response data:', JSON.stringify(responseData, null, 2));
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
