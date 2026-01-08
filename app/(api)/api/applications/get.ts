import { NextRequest, NextResponse } from 'next/server';
import { GetManyApplications } from '@datalib/applications/getApplication';
import getQueries from '@utils/request/getQueries';

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

export async function GET(request: NextRequest) {
  try {
    const queries = await getQueries(request, 'applications');

    const phase = parsePhase(queries.phase ?? null);
    const ucd = parseUcd(queries.ucd ?? null);
    const status = queries.status ?? null; // optional

    // pagination
    const limit = Math.min(Number(queries.limit ?? 50), 200);
    const skip = Math.max(Number(queries.skip ?? 0), 0);

    // build mongo filter
    const filter: Record<string, any> = {};

    // phase controls status set
    if (status) {
      if (!PHASE_TO_STATUSES[phase].includes(status)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Invalid status "${status}" for phase "${phase}"`,
            allowedStatuses: PHASE_TO_STATUSES[phase],
          },
          { status: 400 }
        );
      }
      filter.status = status;
    } else {
      // Otherwise filter by phase's status set
      filter.status = { $in: PHASE_TO_STATUSES[phase] };
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

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: res.error },
        { status: 500 }
      );
    }

    // Normalize _id to string id for frontend
    const applications = (res.body ?? []).map((d: any) => ({
      id: String(d._id),
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      age: d.age,
      isUCDavisStudent: d.isUCDavisStudent,
      university: d.university,
      levelOfStudy: d.levelOfStudy,
      major: d.major,
      minorOrDoubleMajor: d.minorOrDoubleMajor,
      college: d.college,
      year: d.year,
      shirtSize: d.shirtSize,
      dietaryRestrictions: d.dietaryRestrictions,
      connectWithSponsors: d.connectWithSponsors,
      resume: d.resume,
      linkedin: d.linkedin,
      githubOrPortfolio: d.githubOrPortfolio,
      connectWithHackDavis: d.connectWithHackDavis,
      connectWithMLH: d.connectWithMLH,
      status: d.status,
      wasWaitlisted: d.wasWaitlisted,
      submittedAt: d.submittedAt,
      reviewedAt: d.reviewedAt,
      processedAt: d.processedAt,
    }));

    return NextResponse.json({
      ok: true,
      phase,
      ucd,
      status: status ?? null,
      pagination: { limit, skip, returned: applications.length },
      applications,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
