'use server';

import { TitoRequest } from './titoClient';
import { TitoReleaseInvitation } from '@/app/_types/tito';
import { TitoResponse } from '@/app/_types/tito';

export async function getUnredeemedRsvpInvitations(
  rsvpListSlug: string
): Promise<TitoResponse<Map<string, string>>> {
  const pageSize = 500;
  let page = 1;
  let hasMore = true;
  const inviteMap = new Map<string, string>();

  try {
    while (hasMore) {
      const url = `/rsvp_lists/${rsvpListSlug}/release_invitations?page[size]=${pageSize}&page[number]=${page}`;

      const data = await TitoRequest<{
        release_invitations: TitoReleaseInvitation[];
      }>(url);
      const invites = data.release_invitations ?? [];

      for (const invite of invites) {
        if (!invite.email || !invite.unique_url) {
          console.error('[Tito API] Skipping malformed invite:', invite);
          continue;
        }
        if (invite.redeemed) {
          continue;
        }

        inviteMap.set(invite.email.toLowerCase(), invite.unique_url);
      }

      hasMore = invites.length === pageSize;
      page++;
    }
    return { ok: true, body: inviteMap, error: null };
  } catch (err: any) {
    console.error(
      `[Tito] Error fetching invites for ${rsvpListSlug}:`,
      err.message
    );
    return {
      ok: false,
      body: null,
      error: err.message,
    };
  }
}
