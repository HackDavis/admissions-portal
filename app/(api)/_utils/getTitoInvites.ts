'use server';

import axios from 'axios';

// Fetch from Tito
export async function getTitoRsvpList() {
  try {
    const res = await axios.get(
      `${process.env.TITO_EVENT_BASE_URL}/rsvp_lists`,
      {
        headers: {
          Authorization: `Token token=${process.env.TITO_AUTH_TOKEN}`,
        },
      }
    );
    return res.data.rsvp_lists[0]; //ONLY checks first rsvp list
  } catch (err: any) {
    throw new Error(`Failed to fetch Tito RSVP list: ${err.message}`);
  }
}

export async function getUnredeemedTitoInvites(slug: string) {
  const pageSize = 500;
  let page = 1;
  let hasMore = true;
  const inviteMap = new Map<string, string>();

  while (hasMore) {
    try {
      const res = await axios.get(
        `${process.env.TITO_EVENT_BASE_URL}/rsvp_lists/${slug}/release_invitations`,
        {
          params: {
            'page[size]': pageSize,
            'page[number]': page,
          },
          headers: {
            Authorization: `Token token=${process.env.TITO_AUTH_TOKEN}`,
          },
        }
      );

      const invites = res.data.release_invitations ?? [];

      for (const invite of invites) {
        if (!invite.redeemed) {
          inviteMap.set(invite.email.toLowerCase(), invite.unique_url);
        } else {
          console.warn('Invite already redeemed for', invite.email);
        }
      }

      hasMore = invites.length === pageSize;
      page++;
    } catch (err: any) {
      throw new Error(
        `Error fetching Tito invites for slug "${slug}" on page ${page}: ${err.message}`
      );
    }
  }

  return inviteMap;
}
