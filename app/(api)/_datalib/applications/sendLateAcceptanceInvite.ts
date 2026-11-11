import { ObjectId } from 'mongodb';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import bulkCreateInvitations from '@utils/tito/bulkCreateInvitations';
import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';
import type { Application } from '../../../_types/application';

export interface LateAcceptanceInviteOptions {
  rsvpListSlug: string;
  releaseIds: string[];
}

export type LateAcceptanceInviteResult =
  | { ok: true; body: { invitedAt: Date }; error: null }
  | { ok: false; body: null; error: string };

const fail = (error: string): LateAcceptanceInviteResult => ({
  ok: false,
  body: null,
  error,
});

// Sends one late acceptance the same invites finalize sends to accepted
// applicants: a Tito RSVP invite, then a Hub invite and the acceptance email
// through Mailchimp. Only manually added, not-yet-invited applications qualify,
// so this cannot re-invite someone who went through the normal flow.
export const SendLateAcceptanceInvite = async (
  id: string,
  options: LateAcceptanceInviteOptions
): Promise<LateAcceptanceInviteResult> => {
  try {
    if (!ObjectId.isValid(id)) return fail('Invalid application id.');

    const rsvpListSlug =
      typeof options?.rsvpListSlug === 'string'
        ? options.rsvpListSlug.trim()
        : '';
    // Tito returns release ids as numbers even though the Release type says
    // string, so accept both.
    const releaseIds = Array.isArray(options?.releaseIds)
      ? options.releaseIds
          .filter((r) => typeof r === 'string' || typeof r === 'number')
          .map((r) => String(r).trim())
          .filter((r) => r !== '')
      : [];
    if (!rsvpListSlug) return fail('Select an RSVP list.');
    if (releaseIds.length === 0) return fail('Select at least one release.');

    const db = await getDatabase();
    const _id = new ObjectId(id);
    const application = (await db
      .collection('applications')
      .findOne({ _id })) as unknown as Application | null;

    if (!application) return fail('Application not found.');
    if (!application.manualEntry)
      return fail('Only manually added late acceptances can be invited here.');
    if (application.status !== 'accepted')
      return fail('Only accepted applicants can be invited.');
    if (application.manualEntry.invitedAt)
      return fail('This applicant has already been invited.');

    const applicant = { ...application, _id: id };

    // Reuses an existing Tito invite for this email instead of creating a
    // second one, so retrying after a partial failure is safe.
    const tito = await bulkCreateInvitations({
      applicants: [applicant],
      rsvpListSlug,
      releaseIds: releaseIds.join(','),
    });
    const email = application.email.trim().toLowerCase();
    const titoUrl = tito.inviteMap.get(email);
    if (!titoUrl) {
      return fail(
        `Could not create the Tito invite: ${
          tito.errors[0] ?? 'no invite URL returned'
        }`
      );
    }

    const mailchimp = await prepareMailchimpInvites('accepted', {
      applicantIds: [id],
      titoInviteMap: { [email]: titoUrl },
      rsvpListSlug,
    });
    if (!mailchimp.ok || !mailchimp.ids.includes(id)) {
      return fail(
        `The Tito invite was created, but the Hub invite or acceptance email failed: ${
          mailchimp.error ?? 'unknown error'
        }. Try again to retry.`
      );
    }

    const invitedAt = new Date();
    await db
      .collection('applications')
      .updateOne({ _id }, { $set: { 'manualEntry.invitedAt': invitedAt } });

    return { ok: true, body: { invitedAt }, error: null };
  } catch (e) {
    console.error('Error sending late acceptance invite:', e);
    return fail('Could not send the invite. Please try again.');
  }
};
