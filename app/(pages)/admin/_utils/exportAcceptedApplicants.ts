'use client';

import type { ApplicationCondensed } from '@/app/_types/application';
import type { Status } from '@/app/_types/applicationFilters';
import { getApplicationsByStatuses } from '@utils/getFilteredApplications';
import { downloadCSV } from './downloadCSV';

const ACCEPTED_STATUSES: Status[] = ['accepted', 'waitlist_accepted'];

const ACCEPTED_MAP: Record<string, string> = {
  accepted: 'Accepted',
  waitlisted_accepted: 'Waitlist Accepted',
};

const HEADERS = ['Email', 'First Name', 'Last Name', 'Status'];

const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function buildAcceptedCSV(applicants: ApplicationCondensed[]): string {
  const rows = applicants.map((app) =>
    [
      app.email,
      app.firstName,
      app.lastName,
      ACCEPTED_MAP[app.status] ?? app.status,
    ]
      .map(quote)
      .join(',')
  );

  return [HEADERS.map(quote).join(','), ...rows].join('\n');
}

export async function exportAcceptedApplicants(): Promise<number> {
  const applicants = await getApplicationsByStatuses(ACCEPTED_STATUSES);

  if (applicants.length === 0) return 0;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadCSV(
    buildAcceptedCSV(applicants),
    `accepted_applicants_${timestamp}.csv`
  );

  return applicants.length;
}
