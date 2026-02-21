'use server';

import {
  DeleteRsvpInvitationByEmailParams,
  DeleteRsvpInvitationByEmailResult,
  TitoReleaseInvitation,
} from '@typeDefs/tito';
import { TitoRequest } from './titoClient';

export default async function deleteRsvpInvitationByEmail({
  rsvpListSlug,
  email,
}: DeleteRsvpInvitationByEmailParams): Promise<DeleteRsvpInvitationByEmailResult> {
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
    let foundSlug: string | null = null;

    while (!foundSlug) {
      const url = `/rsvp_lists/${rsvpListSlug}/release_invitations?page[size]=${pageSize}&page[number]=${page}`;

      const data = await TitoRequest<any>(url);

      const invitations = (data.release_invitations ??
        []) as TitoReleaseInvitation[];

      const match = invitations.find(
        (invitation) => invitation.email?.toLowerCase() === normalizedEmail
      );

      if (match?.slug) {
        foundSlug = match.slug;
        break;
      }

      if (invitations.length < pageSize) {
        break;
      }

      page += 1;
    }

    if (!foundSlug) {
      return {
        ok: false,
        deletedInvitationSlug: null,
        error: 'No existing RSVP release invitation found for this email',
      };
    }

    const deleteUrl = `/rsvp_lists/${rsvpListSlug}/release_invitations/${foundSlug}`;

    await TitoRequest(deleteUrl, {
      method: 'DELETE',
    });

    return {
      ok: true,
      deletedInvitationSlug: foundSlug,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown delete invitation error';

    return {
      ok: false,
      deletedInvitationSlug: null,
      error: message,
    };
  }
}
