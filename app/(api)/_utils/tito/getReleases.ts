'use server';

import { Release, TitoResponse } from '@/app/_types/tito';
import { TitoRequest } from './titoClient';

export default async function getReleases(): Promise<TitoResponse<Release[]>> {
  try {
    const data = await TitoRequest<{ releases: Release[] }>('/releases');

    return {
      ok: true,
      body: data.releases,
      error: null,
    };
  } catch (e) {
    const error = e as Error;
    console.error('[Tito API] getReleases exception:', error);
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
}
