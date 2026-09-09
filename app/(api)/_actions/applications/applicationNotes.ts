'use server';

import { auth } from '@/auth';
import {
  AddApplicationNote,
  UpdateApplicationNote,
} from '@datalib/applications/applicationNotes';
import { revalidatePath } from 'next/cache';

export async function addApplicationNote(applicationId: string, body: string) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, body: null, error: 'Unauthorized' };
  }

  // Authorship comes from the session so a client cannot post a note as someone else.
  const res = await AddApplicationNote(
    applicationId,
    { id: session.user.id, email: session.user.email },
    body
  );
  revalidatePath('/admin', 'layout');
  return res;
}

export async function updateApplicationNote(
  applicationId: string,
  noteId: string,
  body: string
) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { ok: false, body: null, error: 'Unauthorized' };
  }

  const res = await UpdateApplicationNote(
    applicationId,
    noteId,
    session.user.id,
    body
  );
  revalidatePath('/admin', 'layout');
  return res;
}
