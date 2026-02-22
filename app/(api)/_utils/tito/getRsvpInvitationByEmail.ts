'use server';

import { TitoReleaseInvitation } from '@/app/_types/tito';
import {
  GetRsvpInvitationByEmailParams,
  GetRsvpInvitationByEmailResult,
} from '@/app/_types/tito';
import { TitoRequest } from './titoClient';

export default async function getRsvpInvitationByEmail({
  rsvpListSlug,
  email,
}: GetRsvpInvitationByEmailParams): Promise<GetRsvpInvitationByEmailResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    if (!rsvpListSlug?.trim()) {
      throw new Error('RSVP list slug is required');
    }

    const pageSize = 1000;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `/rsvp_lists/${rsvpListSlug}/release_invitations?page[size]=${pageSize}&page[number]=${page}`;

      const data = await TitoRequest<any>(url);

      const invitations = (data.release_invitations ??
        []) as TitoReleaseInvitation[];

      const match = invitations.find(
        (invitation) => invitation.email?.toLowerCase() === normalizedEmail
      );

      if (match) {
        return {
          ok: true,
          invitation: match,
          error: null,
        };
      }

      hasMore = invitations.length === pageSize;
      page += 1;
    }

    return {
      ok: false,
      invitation: null,
      error: 'No existing RSVP release invitation found for this email',
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown get invitation by email error';

    return {
      ok: false,
      invitation: null,
      error: message,
    };
  }
}
