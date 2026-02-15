'use server';

import createRsvpInvitation from './createRsvpInvitation';
import { Application } from '@/app/_types/application';

interface BulkInvitationResult {
  ok: boolean;
  inviteMap: Map<string, string>; // email -> unique_url
  errors: string[];
}

interface BulkInvitationParams {
  applicants: Application[];
  rsvpListSlug: string;
  releaseIds: string; // comma-separated release IDs
  discountCode?: string;
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
  const CONCURRENCY = 10;

  console.log(
    `[Bulk Tito] Creating ${applicants.length} invitations for RSVP list: ${rsvpListSlug}`
  );
  console.log(`[Bulk Tito] Release IDs: ${releaseIds}`);

  const totalBatches = Math.ceil(applicants.length / CONCURRENCY);
  for (let i = 0; i < applicants.length; i += CONCURRENCY) {
    const batch = applicants.slice(i, i + CONCURRENCY);
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
          const errorMsg = `${app.email}: ${
            result.value.error ?? 'No URL returned'
          }`;
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

    // Small delay between batches to reduce rate-limit risk
    await new Promise((resolve) => setTimeout(resolve, 100));
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
  };
}
