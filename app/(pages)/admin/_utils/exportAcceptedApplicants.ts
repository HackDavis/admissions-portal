'use client';

import type { ApplicationCondensed } from '@/app/_types/application';
import type { Status } from '@/app/_types/applicationFilters';
import { getApplicationsByStatuses } from '@utils/getFilteredApplications';
import { csvField, downloadCSV } from './downloadCSV';

const ACCEPTED_STATUSES: Status[] = ['accepted', 'waitlist_accepted'];

const STATUS_LABELS: Record<string, string> = {
  waitlisted: 'Waitlisted',
  waitlist_rejected: 'Rejected',
  accepted: 'Accepted',
  waitlist_accepted: 'Waitlist Accepted',
};

const HEADERS = ['Email', 'First Name', 'Last Name', 'Status'];

export function buildAcceptedCSV(applicants: ApplicationCondensed[]): string {
  const rows = applicants.map((app) =>
    [
      app.email,
      app.firstName,
      app.lastName,
      STATUS_LABELS[app.status] ?? app.status,
    ]
      .map(csvField)
      .join(',')
  );

  return [HEADERS.map(csvField).join(','), ...rows].join('\n');
}

export async function exportAcceptedApplicants(): Promise<number> {
  return exportApplicants(ACCEPTED_STATUSES, 'accepted');
}

export async function exportRejectedWaitlistedApplicants(): Promise<number> {
  return exportApplicants(
    ['waitlisted', 'waitlist_rejected'],
    'rejected_waitlisted'
  );
}

async function exportApplicants(
  statuses: Status[],
  category: string
): Promise<number> {
  const applicants = await getApplicationsByStatuses(statuses);

  if (applicants.length === 0) return 0;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadCSV(
    buildAcceptedCSV(applicants),
    `${category}_applicants_${timestamp}.csv`
  );

  return applicants.length;
}
