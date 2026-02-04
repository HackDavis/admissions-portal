'use server';

import { getApplicationsByStatuses } from './getApplicationsByType';
import { getManyUsers } from '../_actions/users/getUser';

export async function getUnredeemedHubEmails() {
  // Get all accepted and waitlist_accepted applicants
  const acceptedApplicants = await getApplicationsByStatuses([
    'accepted',
    'waitlist_accepted',
  ]);
  const applicantEmails = Array.from(
    new Set(acceptedApplicants.map((a) => a.email.toLowerCase()))
  );

  const res = await getManyUsers({ email: { $in: applicantEmails } });
  const redeemedEmails = new Set(
    (Array.isArray(res?.body) ? res.body : []).map((u: any) =>
      u.email.toLowerCase()
    )
  );

  // Cross-check applicants that have unredeemed hub invites
  return applicantEmails.filter((email) => !redeemedEmails.has(email));
}
