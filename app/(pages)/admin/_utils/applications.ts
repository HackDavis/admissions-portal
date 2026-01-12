import { Application } from '@/app/_types/application';
import {
  Phase,
  Status,
  UcdStudentFilter,
} from '@/app/_types/applicationFilters';

export async function getApplications(params: {
  phase: Phase;
  ucd: UcdStudentFilter;
  status?: string | null;
}): Promise<Application[]> {
  const search = new URLSearchParams();
  search.set('phase', params.phase);
  search.set('ucd', params.ucd);
  if (params.status) search.set('status', params.status);

  const res = await fetch(`/api/applications?${search.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.applications ?? [];
}

export async function patchApplicationStatus(payload: {
  id: string;
  status: Status;
  wasWaitlisted?: boolean;
}) {
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== undefined)
  );

  const res = await fetch('/api/applications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}
