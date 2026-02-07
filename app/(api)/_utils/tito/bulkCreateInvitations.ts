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

  console.log(
    `[Bulk Tito] Creating ${applicants.length} invitations for RSVP list: ${rsvpListSlug}`
  );
  console.log(`[Bulk Tito] Release IDs: ${releaseIds}`);

  // Process invitations sequentially to avoid rate limiting
  // Tito's rate limit is not clearly documented, so we'll be conservative
  for (const app of applicants) {
    try {
      const result = await createRsvpInvitation({
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        rsvpListSlug,
        releaseIds,
        discountCode,
      });

      if (result.ok && result.body?.unique_url) {
        inviteMap.set(app.email.toLowerCase(), result.body.unique_url);
        console.log(
          `[Bulk Tito] ✓ Created invitation for ${app.email}: ${result.body.unique_url}`
        );
      } else {
        const errorMsg = `${app.email}: ${result.error ?? 'No URL returned'}`;
        errors.push(errorMsg);
        console.error(`[Bulk Tito] ✗ Failed: ${errorMsg}`);
      }

      // Small delay to avoid rate limiting (100ms between requests)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      const errorMsg = `${app.email}: ${error.message ?? error}`;
      errors.push(errorMsg);
      console.error(`[Bulk Tito] ✗ Exception: ${errorMsg}`);
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
  };
}
