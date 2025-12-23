// Supports:
// - UNSEEN vs TENTATIVE vs PROCESSED (via ?phase=unseen|tentative|processed)
// - UCD vs non-UCD (via ?ucd=all|true|false)
// - tentative status filter (via ?status=tentatively_accepted|tentatively_rejected|tentatively_waitlisted)
// - processed status filter (via ?status=accepted|rejected|waitlisted)

import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

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
      isUCDavisStudent: 1,
      status: 1,
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
      email: d.email,
      isUCDavisStudent: d.isUCDavisStudent,
      status: d.status,
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
