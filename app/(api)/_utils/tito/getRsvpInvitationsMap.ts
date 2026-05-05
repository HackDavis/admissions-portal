'use server';

import { TitoRequest } from './titoClient';
import { TitoReleaseInvitation } from '@/app/_types/tito';

export async function getRsvpInvitationsMap(
  rsvpListSlug: string
): Promise<Map<string, string>> {
  if (!rsvpListSlug?.trim()) {
    throw new Error('RSVP list slug is required');
  }

  const pageSize = 1000;
  let page = 1;
  let hasMore = true;
  const inviteMap = new Map<string, string>();

  while (hasMore) {
    const url = `/rsvp_lists/${rsvpListSlug}/release_invitations?page[size]=${pageSize}&page[number]=${page}`;
    const data = await TitoRequest<{
      release_invitations: TitoReleaseInvitation[];
    }>(url);

    const invitations = data.release_invitations ?? [];

    for (const invitation of invitations) {
      const email = invitation.email?.trim().toLowerCase();
      const inviteUrl = invitation.unique_url || invitation.url;
      if (!email || !inviteUrl) continue;

      if (!inviteMap.has(email)) {
        inviteMap.set(email, inviteUrl);
      }
    }

    hasMore = invitations.length === pageSize;
    page += 1;
  }

  return inviteMap;
}
