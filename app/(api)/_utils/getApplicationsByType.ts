'use server';

import { getAdminApplications } from '@actions/applications/getApplication';
import { Application } from '@/app/_types/application';
import { Status } from '@app/_types/applicationFilters';

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

  return applicants.map((app: any) => ({
    ...app,
    _id: String(app._id),
  }));
}

export async function getApplicationsForRsvpReminder() {
  // Filters out duplicate emails for Tito and Hub invites
  // TODO: call getUnredeemedHubInvites and getUnredeemedTitoInvites and cross reference
  //   const applicants = res.body ?? [];
  //   return applicants.map((app: any) => ({
  //     ...app,
  //     _id: String(app._id),
  //   }));
  return [];
}
