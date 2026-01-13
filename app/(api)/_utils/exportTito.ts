'use server';

import { GetManyApplications } from '@datalib/applications/getApplication';
import { Application } from '@/app/_types/application';

export async function exportTitoCSV() {
  const applicants = await getApplicationsByStatus('tentatively_accepted');
  return generateCSV(applicants);
}

async function getApplicationsByStatus(status: string): Promise<Application[]> {
  const query = { status: status };
  const res = await GetManyApplications(query);

  if (!res.ok) throw new Error(res.error ?? 'Failed to fetch applicants');

  const applicants = res.body ?? [];
  console.log(`Found ${applicants.length} tentatively_accepted applicants`);
  if (applicants.length === 0) {
    console.log('No tentatively accepted applicants found');
    //TODO: add error handling
  }

  return (res.body ?? []).map((app: any) => ({
    ...app,
    _id: String(app._id),
  }));
}

// Csv generation
async function generateCSV(applicants: Application[]) {
  // Tito import format: Email, First Name, Last Name
  const headers = ['Email', 'First Name', 'Last Name'];

  const rows = applicants.map((a) =>
    [a.email, a.firstName, a.lastName].map((v) => `"${v}"`).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
