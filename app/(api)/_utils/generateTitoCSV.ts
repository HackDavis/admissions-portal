'use server';

import { Application } from '@/app/_types/application';
import { Status } from '@app/_types/applicationFilters';
import { getApplicationsByStatuses } from './getApplicationsByType';

export async function generateTitoCSV(statuses: Status | Status[]) {
  const applicants = await getApplicationsByStatuses(statuses);
  return generateCSV(applicants);
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
    process.env.TITO_HACKER_TICKET_NAME, //name of the ticket in tito
  ];

  const rows = applicants.map((a) =>
    [
      a.firstName,
      a.lastName,
      a.email,
      process.env.TITO_TICKET_EXPIRY, // expiry time
      'Y', // redirect
      '', // discount code
      'Y', // ticket assignment
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
