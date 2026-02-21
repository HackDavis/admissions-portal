'use server';

import { TitoRequest } from './titoClient';
import { TitoReleaseInvitation } from '@/app/_types/tito';

export async function getUnredeemedTitoInvites(rsvpListSlug: string) {
  const pageSize = 500;
  let page = 1;
  let hasMore = true;
  const inviteMap = new Map<string, string>();

  while (hasMore) {
    try {
      const url = `/rsvp_lists/${rsvpListSlug}/release_invitations?page[size]=${pageSize}&page[number]=${page}`;

      const data = await TitoRequest<{
        release_invitations: TitoReleaseInvitation[];
      }>(url);
      const invites = data.release_invitations ?? [];

      for (const invite of invites) {
        if (!invite.redeemed && invite.email && invite.unique_url) {
          inviteMap.set(invite.email.toLowerCase(), invite.unique_url);
        } else {
          console.warn('Invite already redeemed for', invite.email);
        }
      }

      hasMore = invites.length === pageSize;
      page++;
    } catch (err: any) {
      throw new Error(
        `Error fetching Tito invites for slug "${rsvpListSlug}" on page ${page}: ${err.message}`
      );
    }
  }

  return inviteMap;
}
