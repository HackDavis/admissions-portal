'use server';

import { getAdminApplications } from '@actions/applications/getApplication';
import { Application } from '@/app/_types/application';
import { Status } from '@app/_types/applicationFilters';
import { getUnredeemedHubEmails } from './getUnredeemedHubUsers';
import { getUnredeemedTitoInvites, getTitoRsvpList } from './getTitoInvites';

export async function getApplicationsByStatuses(
  statuses: Status | Status[]
): Promise<Application[]> {
  const query = {
    status: Array.isArray(statuses) ? { $in: statuses } : statuses,
  };
  const projection = {
    firstName: 1,
    lastName: 1,
    email: 1,
    status: 1,
  };

  const res = await getAdminApplications(query, projection);

  if (!res.ok) throw new Error(res.error ?? 'Failed to fetch applicants');

  const applicants = res.body ?? [];

  console.log(
    `Found ${applicants.length} applicants for statuses: ${statuses}`
  );

  if (applicants.length === 0) {
    console.log(`No ${statuses} applicants found`);
  }

  return applicants;
}

export async function getApplicationsForRsvpReminder(): Promise<Application[]> {
  const RSVP_LIST_INDEX = 0; // ONLY checks first rsvp list

  try {
    const unredeemedHubEmails = await getUnredeemedHubEmails();
    console.log('Unredeemed Hub emails:', unredeemedHubEmails);
    const rsvpList = await getTitoRsvpList(RSVP_LIST_INDEX);
    const unredeemedTitoMap = await getUnredeemedTitoInvites(rsvpList.slug);
    console.log('Unredeemed Tito emails:', unredeemedTitoMap);

    // Merge unredeemed invites from both Hub and Tito (deduplicate by email)
    // This is a UNION operation (either unredeemed in Hub OR Tito)
    const uniqueEmails = Array.from(
      new Set([...unredeemedHubEmails, ...Array.from(unredeemedTitoMap.keys())])
    );
    console.log('Unique unredeemed (hub or tito) emails:', uniqueEmails);

    if (uniqueEmails.length === 0) {
      console.log('No unredeemed applicants found.');
      return [];
    }

    const acceptedStatuses: Status[] = ['accepted', 'waitlist_accepted'];
    const query = {
      email: { $in: uniqueEmails },
      status: { $in: acceptedStatuses },
    };

    const projection = {
      firstName: 1,
      lastName: 1,
      email: 1,
      status: 1,
    };

    const res = await getAdminApplications(query, projection);

    if (!res.ok) throw new Error(res.error ?? 'Failed to fetch applicants');

    const applicants = res.body ?? [];
    console.log('Applicants to rsvp remind:', applicants);

    return applicants;
  } catch (err: any) {
    console.error('Error fetching applications for RSVP reminder:', err);
    throw err;
  }
}
