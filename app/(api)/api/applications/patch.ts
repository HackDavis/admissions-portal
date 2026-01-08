import { NextRequest, NextResponse } from 'next/server';
import { UpdateApplication } from '@datalib/applications/updateApplication';

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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
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

    // const client = await getMongoClient();
    // const dbName = process.env.MONGODB_DB;
    // const db = dbName ? client.db(dbName) : client.db();

    // const collectionName = process.env.MONGODB_COLLECTION ?? 'applications';
    // const col = db.collection(collectionName);

    // const filter: any = ObjectId.isValid(id)
    //   ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
    //   : { _id: id };
    const update: Record<string, unknown> = { status };
    if (typeof wasWaitlisted === 'boolean')
      update.wasWaitlisted = wasWaitlisted;
    if (
      TENTATIVE_STATUSES.includes(status as (typeof TENTATIVE_STATUSES)[number])
    ) {
      update.reviewedAt = new Date().toISOString();
    }
    if (
      PROCESSED_STATUSES.includes(status as (typeof PROCESSED_STATUSES)[number])
    ) {
      update.processedAt = new Date().toISOString();
    }

    const result = await UpdateApplication(id, update);
    // const result = await col.updateOne(filter, { $set: update });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? 'Failed to update applicant.' },
        { status: 500 }
      );
    }
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
}
