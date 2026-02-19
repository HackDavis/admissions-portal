'use server';

import createRsvpInvitation from './createRsvpInvitation';
import deleteRsvpInvitationByEmail from './deleteRsvpInvitationByEmail';
import getRsvpInvitationByEmail from './getRsvpInvitationByEmail';
import { BulkInvitationParams, BulkInvitationResult } from '@/app/_types/tito';

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

  console.log(
    `[Bulk Tito] Creating ${uniqueApplicants.length} invitations for RSVP list: ${rsvpListSlug}`
  );
  console.log(`[Bulk Tito] Release IDs: ${releaseIds}`);

  const totalBatches = Math.ceil(uniqueApplicants.length / CONCURRENCY);
  for (let i = 0; i < uniqueApplicants.length; i += CONCURRENCY) {
    const batch = uniqueApplicants.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;

    console.log(
      `[Bulk Tito] Processing batch ${batchNum}/${totalBatches} (${batch.length} applicants)`
    );

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

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      const app = batch[j];

      if (result.status === 'fulfilled') {
        if (result.value.ok && result.value.body?.unique_url) {
          inviteMap.set(app.email.toLowerCase(), result.value.body.unique_url);
          console.log(
            `[Bulk Tito] ✓ Created invitation for ${app.email}: ${result.value.body.unique_url}`
          );
        } else {
          const createError = result.value.error ?? 'No URL returned';

          if (isDuplicateTicketError(createError)) {
            console.warn(
              `[Bulk Tito] Duplicate ticket detected for ${app.email}. Attempting to reuse existing invite URL before delete + retry.`
            );

            const existingInviteResult = await getRsvpInvitationByEmail({
              rsvpListSlug,
              email: app.email,
            });

            if (existingInviteResult.ok && existingInviteResult.invitation) {
              const existingInviteUrl =
                existingInviteResult.invitation.unique_url ||
                existingInviteResult.invitation.url;

              if (existingInviteUrl) {
                inviteMap.set(app.email.toLowerCase(), existingInviteUrl);
                autoFixedCount += 1;
                autoFixedNotesMap[app.email.toLowerCase()] =
                  'Existing Tito invite was reused due to duplicate email.';
                console.log(
                  `[Bulk Tito] ✓ Reused existing invitation for ${app.email}: ${existingInviteUrl}`
                );
                continue;
              }
            }

            const deleteResult = await deleteRsvpInvitationByEmail({
              rsvpListSlug,
              email: app.email,
            });

            if (deleteResult.ok) {
              console.log(
                `[Bulk Tito] Deleted existing invitation ${deleteResult.deletedInvitationSlug} for ${app.email}. Retrying create.`
              );

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
                console.log(
                  `[Bulk Tito] ✓ Retry succeeded for ${app.email}: ${retryResult.body.unique_url}`
                );
                continue;
              }

              const retryErrorMsg = `${
                app.email
              }: retry failed after deleting existing Tito invitation (${
                retryResult.error ?? 'No URL returned'
              })`;
              errors.push(retryErrorMsg);
              console.error(`[Bulk Tito] ✗ Failed: ${retryErrorMsg}`);
              continue;
            }

            const recoveryErrorMsg = `${app.email}: duplicate ticket recovery failed (${deleteResult.error})`;
            errors.push(recoveryErrorMsg);
            console.error(`[Bulk Tito] ✗ Failed: ${recoveryErrorMsg}`);
            continue;
          }

          const errorMsg = `${app.email}: ${createError}`;
          errors.push(errorMsg);
          console.error(`[Bulk Tito] ✗ Failed: ${errorMsg}`);
        }
      } else {
        const errorMsg = `${app.email}: ${
          result.reason?.message ?? result.reason ?? 'Unknown error'
        }`;
        errors.push(errorMsg);
        console.error(`[Bulk Tito] ✗ Exception: ${errorMsg}`);
      }
    }
  }

  const successCount = inviteMap.size;
  const failureCount = errors.length;

  console.log(
    `[Bulk Tito] Complete: ${successCount} succeeded, ${failureCount} failed`
  );

  return {
    ok: successCount > 0,
    inviteMap,
    errors,
    autoFixedCount,
    autoFixedNotesMap,
  };
}
