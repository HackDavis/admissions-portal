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

//csv download
// export function downloadCSV(csvContent: string) {
//   console.log('Exporting tentatively accepted applicants to CSV...\n');
//   const blob = new Blob([csvContent], { type: 'text/csv' });
//   const link = document.createElement('a');
//   link.href = URL.createObjectURL(blob);
//   link.download = `tito_import_${new Date().toISOString().split('T')[0]}.csv`;
//   link.click();
//   URL.revokeObjectURL(link.href);

//   console.log('\nExport complete!');
//   console.log('\nNext steps:');
//   console.log('   1. Go to your Tito RSVP Lists');
//   console.log('   2. Navigate to Actions → Manage Invitations');
//   console.log("   3. Click the 'Import' button");
//   console.log(`   4. Upload the file: ${link.download}`);
//   console.log('   5. Tito will create all the invitations!');
//   console.log(
//     '\nAfter import, you can use the prepareMailChimp.ts to fetch the invitation URLs and send them via Mailchimp.'
//   );
// }
