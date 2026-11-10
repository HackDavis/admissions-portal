'use server';

import { auth } from '@/auth';
import { CreateLateAcceptance } from '@datalib/applications/createLateAcceptance';
import type { LateAcceptanceResult } from '@app/_utils/lateAcceptance';
import { revalidatePath } from 'next/cache';

export async function createLateAcceptance(
  body: unknown
): Promise<LateAcceptanceResult> {
  // The page is admin-only, but server actions can be called directly.
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, body: null, error: 'Unauthorized' };
  }

  // The adding admin comes from the session, never from the request body.
  const res = await CreateLateAcceptance(body, {
    id: session.user.id,
    email: session.user.email,
  });
  if (res.ok) revalidatePath('/admin', 'layout');
  return res;
}
