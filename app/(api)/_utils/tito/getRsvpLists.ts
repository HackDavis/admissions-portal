'use server';

import { RsvpList, TitoResponse } from '@/app/_types/tito';
import { TitoRequest } from './titoClient';

export default async function getRsvpLists(): Promise<
  TitoResponse<RsvpList[]>
> {
  try {
    const data = await TitoRequest<{ rsvp_lists: RsvpList[] }>('/rsvp_lists');

    return {
      ok: true,
      body: data.rsvp_lists,
      error: null,
    };
  } catch (e) {
    const error = e as Error;
    console.error('[Tito API] getRsvpLists exception:', error);
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
}
