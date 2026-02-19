'use server';

import { TitoReleaseInvitation } from '@/app/_types/tito';
import {
  GetRsvpInvitationByEmailParams,
  GetRsvpInvitationByEmailResult,
} from '@/app/_types/tito';

const TITO_AUTH_TOKEN = process.env.TITO_AUTH_TOKEN;
const TITO_EVENT_BASE_URL = process.env.TITO_EVENT_BASE_URL;

export default async function getRsvpInvitationByEmail({
  rsvpListSlug,
  email,
}: GetRsvpInvitationByEmailParams): Promise<GetRsvpInvitationByEmailResult> {
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
    let hasMore = true;

    while (hasMore) {
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
