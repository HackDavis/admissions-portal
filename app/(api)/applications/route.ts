// Supports:
// - UNSEEN vs TENTATIVE vs PROCESSED (via ?phase=unseen|tentative|processed)
// - UCD vs non-UCD (via ?ucd=all|true|false)
// - tentative status filter (via ?status=tentatively_accepted|tentatively_rejected|tentatively_waitlisted)
// - processed status filter (via ?status=accepted|rejected|waitlisted)

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import authenticated from '@utils/authentication/authenticated';

type Phase = 'unseen' | 'tentative' | 'processed';
type UcdParam = 'all' | 'true' | 'false';

const TENTATIVE_STATUSES = [
  'tentatively_accepted',
  'tentatively_rejected',
  'tentatively_waitlisted',
] as const;

const PROCESSED_STATUSES = ['accepted', 'rejected', 'waitlisted'] as const;
const ALL_STATUSES = [
  'pending',
  ...TENTATIVE_STATUSES,
  ...PROCESSED_STATUSES,
] as const;

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

function isAllowedStatusForPhase(phase: Phase, status: string): boolean {
  return PHASE_TO_STATUSES[phase].includes(status);
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI env var');

  if (!global.__mongoClientPromise) {
    const client = new MongoClient(uri);
    global.__mongoClientPromise = client.connect();
  }
  return global.__mongoClientPromise;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const phase = parsePhase(searchParams.get('phase'));
    const ucd = parseUcd(searchParams.get('ucd'));
    const status = searchParams.get('status'); // optional

    // pagination
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200);
    const skip = Math.max(Number(searchParams.get('skip') ?? '0'), 0);

    // build mongo filter
    const filter: Record<string, any> = {};

    // phase controls status set
    if (status) {
      if (!isAllowedStatusForPhase(phase, status)) {
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

    // Connect + query
    const client = await getMongoClient();

    const dbName = process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();

    const collectionName = process.env.MONGODB_COLLECTION ?? 'applications';
    const col = db.collection(collectionName);

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

    const docs = await col
      .find(filter, { projection })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Normalize _id to string id for frontend
    const applications = docs.map((d: any) => ({
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

export const PATCH = authenticated(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const id = body?.id as string | undefined;
    const status = body?.status as string | undefined;
    const wasWaitlisted = body?.wasWaitlisted as boolean | undefined;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Invalid applicant id.' },
        { status: 400 }
      );
    }

    if (
      !status ||
      !ALL_STATUSES.includes(status as (typeof ALL_STATUSES)[number])
    ) {
      return NextResponse.json(
        { ok: false, error: 'Invalid status.' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const dbName = process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();

    const collectionName = process.env.MONGODB_COLLECTION ?? 'applications';
    const col = db.collection(collectionName);

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };
    const update: Record<string, unknown> = { status };
    if (typeof wasWaitlisted === 'boolean') update.wasWaitlisted = wasWaitlisted;
    const result = await col.updateOne(filter, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { ok: false, error: 'Applicant not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, id, status });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
});
