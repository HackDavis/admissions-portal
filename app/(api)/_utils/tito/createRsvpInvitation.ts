'use server';

import {
  InvitationData,
  ReleaseInvitation,
  TitoResponse,
} from '@typeDefs/tito';
import { TitoRequest } from './titoClient';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

/** Exported so tests can mock it to avoid real waits. */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function createRsvpInvitation(
  data: InvitationData
): Promise<TitoResponse<ReleaseInvitation>> {
  try {
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

    if (data.firstName?.trim()) requestBody.first_name = data.firstName.trim();
    if (data.lastName?.trim()) requestBody.last_name = data.lastName.trim();
    if (data.discountCode?.trim())
      requestBody.discount_code = data.discountCode.trim();

    const url = `/rsvp_lists/${data.rsvpListSlug}/release_invitations`;

    // let lastError = '';
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await TitoRequest<{
          release_invitation: ReleaseInvitation;
        }>(url, {
          method: 'POST',
          body: JSON.stringify({ release_invitation: requestBody }),
        });
        return { ok: true, body: response.release_invitation, error: null };
      } catch (error: any) {
        const isRateLimited = error.message.includes('429');
        // Handle rate limiting with retries (Retry-After header is extract in TitoRequest)
        if (isRateLimited && attempt < MAX_RETRIES) {
          const waitMs = error.retryAfter
            ? parseFloat(error.retryAfter) * BASE_DELAY_MS
            : Math.pow(2, attempt) * BASE_DELAY_MS +
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
        throw error;
      }
    }
    // All retries exhausted on 429
    throw new Error('Tito API rate limit exceeded after 5 retries');
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
