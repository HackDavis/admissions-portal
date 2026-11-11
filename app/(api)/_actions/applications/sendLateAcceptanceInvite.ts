'use server';

import { auth } from '@/auth';
import {
  LateAcceptanceInviteOptions,
  LateAcceptanceInviteResult,
  SendLateAcceptanceInvite,
} from '@datalib/applications/sendLateAcceptanceInvite';
import { revalidatePath } from 'next/cache';

export async function sendLateAcceptanceInvite(
  applicationId: string,
  options: LateAcceptanceInviteOptions
): Promise<LateAcceptanceInviteResult> {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, body: null, error: 'Unauthorized' };
  }

  const res = await SendLateAcceptanceInvite(applicationId, options);
  if (res.ok) revalidatePath('/admin', 'layout');
  return res;
}
