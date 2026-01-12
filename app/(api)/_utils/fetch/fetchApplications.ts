import { Application } from '@/app/_types/application';
import {
  Status,
  Phase,
  UcdStudentFilter,
} from '@/app/_types/applicationFilters';

interface FetchApplicationsParams {
  phase: Phase;
  status?: Status | null;
  ucd?: UcdStudentFilter;
  limit?: number;
  skip?: number;
}

export async function fetchApplications({
  phase,
  status,
  ucd = 'all',
  limit = 50,
  skip = 0,
}: FetchApplicationsParams): Promise<Application[]> {
  const params = new URLSearchParams({
    phase,
    ucd,
    limit: String(limit),
    skip: String(skip),
  });
  if (status) params.set('status', status);

  const res = await fetch(`/api/applications?${params.toString()}`);
  const data = await res.json();

  if (!data.ok) throw new Error(data.error || 'Failed to fetch applications');

  return data.applications;
}
