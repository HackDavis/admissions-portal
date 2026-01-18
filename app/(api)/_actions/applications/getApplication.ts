'use server';
import {
  GetApplication,
  GetManyApplications,
} from '@datalib/applications/getApplication';

type Phase = 'unseen' | 'tentative' | 'processed';
type UcdParam = 'all' | 'true' | 'false';

const TENTATIVE_STATUSES = [
  'tentatively_accepted',
  'tentatively_rejected',
  'tentatively_waitlisted',
] as const;

const PROCESSED_STATUSES = ['accepted', 'rejected', 'waitlisted'] as const;

const PHASE_TO_STATUSES: Record<Phase, readonly string[]> = {
  unseen: ['pending'],
  tentative: TENTATIVE_STATUSES,
  processed: PROCESSED_STATUSES,
};

function parsePhase(raw: string | null): Phase {
  if (raw === 'unseen' || raw === 'tentative' || raw === 'processed')
    return raw;
  return 'unseen';
}

function parseUcd(raw: string | null): UcdParam {
  if (raw === 'true' || raw === 'false' || raw === 'all') return raw;
  return 'all';
}

export async function getApplication(id: string) {
  const res = await GetApplication(id);
  return JSON.parse(JSON.stringify(res));
}

export async function getManyApplications(query: any = {}) {
  try {
    const phase = parsePhase(query.phase);
    const ucd = parseUcd(query.ucd);
    const status = query.status || null; // optional

    // pagination
    const limit = Math.min(Number(query.limit ?? 50), 200);
    const skip = Math.max(Number(query.skip ?? 0), 0);

    // build mongo filter
    const filter: Record<string, any> = {};

    // phase controls status set
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: PHASE_TO_STATUSES[phase] || [] };
    }

    // UCD filter
    if (ucd === 'true') filter.isUCDavisStudent = true;
    if (ucd === 'false') filter.isUCDavisStudent = false;

    // projection keeps payload smaller (adjust as you need)
    const projection = {
      email: 1,
      firstName: 1,
      lastName: 1,
      phone: 1,
      age: 1,
      isUCDavisStudent: 1,
      university: 1,
      levelOfStudy: 1,
      major: 1,
      minorOrDoubleMajor: 1,
      college: 1,
      year: 1,
      shirtSize: 1,
      dietaryRestrictions: 1,
      connectWithSponsors: 1,
      resume: 1,
      linkedin: 1,
      githubOrPortfolio: 1,
      connectWithHackDavis: 1,
      connectWithMLH: 1,
      status: 1,
      wasWaitlisted: 1,
      submittedAt: 1,
      reviewedAt: 1,
      processedAt: 1,
    };

    const res = await GetManyApplications(filter, {
      projection,
      sort: { submittedAt: -1 },
      limit,
      skip,
    });

    if (!res.ok) return { ok: false, error: res.error };

    // Normalize _id to string id for frontend
    const applications = (res.body ?? []).map((d: any) => ({
      ...d,
      _id: String(d._id),
    }));

    return { ok: true, body: applications };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
