'use server';

import { getAdminApplications } from '@actions/applications/getAdminApplications';
import { Application } from '@/app/_types/application';
import { Status } from '@app/_types/applicationFilters';

export async function exportTitoCSV(status: Status) {
  const applicants = await getApplicationsByStatus(status);
  return generateCSV(applicants);
}

export async function getApplicationsByStatus(
  status: string
): Promise<Application[]> {
  const query = { status: status };
  const projection = {
    firstName: 1,
    lastName: 1,
    email: 1,
    status: 1,
  };

  const res = await getAdminApplications(query, projection);

  if (!res.ok) throw new Error(res.error ?? 'Failed to fetch applicants');

  const applicants = res.body ?? [];
  console.log(`Found ${applicants.length} tentatively_accepted applicants`);
  if (applicants.length === 0) {
    console.log(`No ${status} applicants found`);
  }

  return applicants.map((app: any) => ({
    ...app,
    _id: String(app._id),
  }));
}

// Csv generation
async function generateCSV(applicants: Application[]) {
  // Tito import format: Email, First Name, Last Name
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Expiry Time',
    'Redirect?',
    'Discount Code',
    'test ticket', //name of the ticket in tito
  ];

  const rows = applicants.map((a) =>
    [
      a.firstName,
      a.lastName,
      a.email,
      '2026-05-09 23:59 PST', // expiry time
      'Y', // redirect
      '', // discount code
      'Y', // ticket assignment
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
