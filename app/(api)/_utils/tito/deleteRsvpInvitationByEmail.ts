'use server';

import {
  DeleteRsvpInvitationByEmailParams,
  DeleteRsvpInvitationByEmailResult,
  TitoReleaseInvitation,
} from '@typeDefs/tito';

const TITO_AUTH_TOKEN = process.env.TITO_AUTH_TOKEN;
const TITO_EVENT_BASE_URL = process.env.TITO_EVENT_BASE_URL;

export default async function deleteRsvpInvitationByEmail({
  rsvpListSlug,
  email,
}: DeleteRsvpInvitationByEmailParams): Promise<DeleteRsvpInvitationByEmailResult> {
  try {
    if (!TITO_AUTH_TOKEN || !TITO_EVENT_BASE_URL) {
      throw new Error(
        'Missing Tito API configuration in environment variables'
      );
    }

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
      const listUrl = `${TITO_EVENT_BASE_URL}/rsvp_lists/${rsvpListSlug}/release_invitations?page[size]=${pageSize}&page[number]=${page}`;

      const listResponse = await fetch(listUrl, {
        method: 'GET',
        headers: {
          Authorization: `Token token=${TITO_AUTH_TOKEN}`,
          Accept: 'application/json',
        },
      });

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        throw new Error(
          `Failed to list RSVP release invitations: ${listResponse.status} - ${errorText}`
        );
      }

      const listData = await listResponse.json();
      const invitations = (listData.release_invitations ??
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

    const deleteUrl = `${TITO_EVENT_BASE_URL}/rsvp_lists/${rsvpListSlug}/release_invitations/${foundSlug}`;

    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Token token=${TITO_AUTH_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(
        `Failed to delete RSVP release invitation ${foundSlug}: ${deleteResponse.status} - ${errorText}`
      );
    }

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
