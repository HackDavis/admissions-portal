'use server';

import { getAdminApplications } from '@actions/applications/getApplication';
import { Application } from '@/app/_types/application';
import { Status } from '@app/_types/applicationFilters';

export async function generateTitoCSV(
  statuses: Status | Status[],
  titoInviteMap?: Map<string, string> // email -> Tito invite URL
) {
  const applicants = await getApplicationsByStatuses(statuses);
  return generateCSV(applicants, titoInviteMap);
}

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

// Csv generation
async function generateCSV(
  applicants: Application[],
  titoInviteMap?: Map<string, string>
) {
  // Tito import format: Email, First Name, Last Name
  // If titoInviteMap is provided, we include the Tito URL instead of generating import format
  const headers = titoInviteMap
    ? ['First Name', 'Last Name', 'Email', 'Tito Invite URL']
    : [
        'First Name',
        'Last Name',
        'Email',
        'Expiry Time',
        'Redirect?',
        'Discount Code',
        'test ticket', //name of the ticket in tito
      ];

  const rows = applicants.map((a) => {
    if (titoInviteMap) {
      // Export format with Tito URLs (invites already created)
      const titoUrl = titoInviteMap.get(a.email.toLowerCase()) || 'NOT_FOUND';
      return [a.firstName, a.lastName, a.email, titoUrl]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    } else {
      // Import format for Tito (manual upload)
      return [
        a.firstName,
        a.lastName,
        a.email,
        '2026-05-09 23:59 PST', // expiry time
        'Y', // redirect
        '', // discount code
        'Y', // ticket assignment
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    }
  });

  return [headers.join(','), ...rows].join('\n');
}
