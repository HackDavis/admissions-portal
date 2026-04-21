'use server';

import createRsvpInvitation from './createRsvpInvitation';
import deleteRsvpInvitationByEmail from './deleteRsvpInvitationByEmail';
import { BulkInvitationParams, BulkInvitationResult } from '@/app/_types/tito';
import { getRsvpInvitationsMap } from './getRsvpInvitationsMap';

function isDuplicateTicketError(error: string | null | undefined): boolean {
  if (!error) return false;
  const normalized = error.toLowerCase();

  return (
    normalized.includes('already has a tito ticket attached') ||
    normalized.includes('already has a ticket attached') ||
    normalized.includes('email has already been taken') ||
    normalized.includes('has already been taken') ||
    (normalized.includes('"email"') && normalized.includes('already taken')) ||
    normalized.includes('already exists') ||
    (normalized.includes('already') && normalized.includes('invitation'))
  );
}

/**
 * Creates Tito RSVP invitations for multiple applicants in bulk.
 * Returns a map of email -> Tito invite URL for successful invitations.
 */
export default async function bulkCreateInvitations(
  params: BulkInvitationParams
): Promise<BulkInvitationResult> {
  const { applicants, rsvpListSlug, releaseIds, discountCode } = params;
  const inviteMap = new Map<string, string>();
  const errors: string[] = [];
  let autoFixedCount = 0;
  const autoFixedNotesMap: Record<string, string> = {};
  const CONCURRENCY = 20;
  const seenEmails = new Set<string>();
  let preloadedInviteMap = new Map<string, string>();
  let skippedFromCreateCount = 0;
  let queuedForCreateCount = 0;

  const uniqueApplicants = applicants.filter((app) => {
    const normalizedEmail = app.email.toLowerCase().trim();
    if (seenEmails.has(normalizedEmail)) {
      errors.push(
        `${app.email}: skipped duplicate applicant email in finalize batch`
      );
      return false;
    }
    seenEmails.add(normalizedEmail);
    return true;
  });

  try {
    preloadedInviteMap = await getRsvpInvitationsMap(rsvpListSlug);
  } catch {
    preloadedInviteMap = new Map<string, string>();
  }

  const applicantsToCreate: typeof uniqueApplicants = [];

  for (const app of uniqueApplicants) {
    const normalizedEmail = app.email.toLowerCase();
    const existingInviteUrl = preloadedInviteMap.get(normalizedEmail);

    if (existingInviteUrl) {
      skippedFromCreateCount += 1;
      console.log(
        `[Bulk Tito] Pre-pulled invite for ${normalizedEmail}; skipping Tito create`
      );
      inviteMap.set(normalizedEmail, existingInviteUrl);
      autoFixedCount += 1;
      autoFixedNotesMap[normalizedEmail] =
        'Existing Tito invite was reused due to duplicate email.';
      continue;
    }

    queuedForCreateCount += 1;
    console.log(
      `[Bulk Tito] No pre-pulled invite for ${normalizedEmail}; will create in Tito`
    );
    applicantsToCreate.push(app);
  }

  console.log(
    `[Bulk Tito] Pre-pull summary: skipped=${skippedFromCreateCount}, create=${queuedForCreateCount}`
  );

  for (let i = 0; i < applicantsToCreate.length; i += CONCURRENCY) {
    const batch = applicantsToCreate.slice(i, i + CONCURRENCY);

    // Process the batch with concurrency
    const batchResults = await Promise.allSettled(
      batch.map((app) =>
        createRsvpInvitation({
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email,
          rsvpListSlug,
          releaseIds,
          discountCode,
        })
      )
    );

    // Handle results and recovery logic
    for (let j = 0; j < batchResults.length; j++) {
      try {
        const result = batchResults[j];
        const app = batch[j];
        const normalizedEmail = app.email.toLowerCase();

        if (
          result.status === 'fulfilled' &&
          result.value.ok &&
          result.value.body?.unique_url
        ) {
          inviteMap.set(normalizedEmail, result.value.body.unique_url);
          continue;
        }

        const createError =
          result.status === 'fulfilled'
            ? result.value.error
            : result.reason?.message;

        // Recovery logic for duplicate ticket errors
        if (isDuplicateTicketError(createError)) {
          const existingInviteUrl = preloadedInviteMap.get(normalizedEmail);
          if (existingInviteUrl) {
            inviteMap.set(normalizedEmail, existingInviteUrl);
            autoFixedCount += 1;
            autoFixedNotesMap[normalizedEmail] =
              'Existing Tito invite was reused due to duplicate email.';
            continue;
          }

          const deleteResult = await deleteRsvpInvitationByEmail({
            rsvpListSlug,
            email: app.email,
          });

          if (deleteResult.ok) {
            const retryResult = await createRsvpInvitation({
              firstName: app.firstName,
              lastName: app.lastName,
              email: app.email,
              rsvpListSlug,
              releaseIds,
              discountCode,
            });

            if (retryResult.ok && retryResult.body?.unique_url) {
              inviteMap.set(
                app.email.toLowerCase(),
                retryResult.body.unique_url
              );
              autoFixedCount += 1;
              autoFixedNotesMap[app.email.toLowerCase()] =
                'A new Tito invite was generated due to duplication.';
              continue;
            }

            const retryErrorMsg = `${
              app.email
            }: retry failed after deleting existing Tito invitation (${
              retryResult.error ?? 'No URL returned'
            })`;
            errors.push(retryErrorMsg);
            console.error(`[Bulk Tito] Failed: ${retryErrorMsg}`);
            continue;
          }

          const finalErrorMsg = `${app.email}: duplicate ticket recovery failed (${deleteResult.error})`;
          errors.push(finalErrorMsg);
          console.error(`[Bulk Tito] Failed: ${finalErrorMsg}`);
          continue;
        }
        const errorMsg = `${app.email}: ${createError || 'Unknown Error'}`;
        errors.push(errorMsg);
        console.error(`[Bulk Tito] Failed: ${errorMsg}`);
      } catch (error: any) {
        const app = batch[j];
        const unexpectedError = `${
          app.email
        }: unexpected Tito processing error (${error?.message ?? error})`;
        errors.push(unexpectedError);
        console.error(`[Bulk Tito] Failed: ${unexpectedError}`);
      }
    }
  }

  const successCount = inviteMap.size;

  return {
    ok: successCount > 0,
    inviteMap,
    errors,
    autoFixedCount,
    autoFixedNotesMap,
  };
}
