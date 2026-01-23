import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import parseAndReplace from '@utils/request/parseAndReplace';
import { HttpError, NotFoundError } from '@utils/response/Errors';
import { ObjectId } from 'mongodb';
import { Phase } from '@app/_types/applicationFilters';

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

export const GetApplication = async (id: string) => {
  try {
    const object_id = new ObjectId(id);
    const db = await getDatabase();

    const application = await db.collection('applications').findOne({
      _id: object_id,
    });

    if (application === null) {
      throw new NotFoundError(`Application with id: ${id} not found.`);
    }

    return { ok: true, body: application, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};

export const GetManyApplications = async (
  query: object = {},
  options?: {
    projection?: Record<string, number>;
    sort?: Record<string, number>;
    limit?: number;
    skip?: number;
  }
) => {
  try {
    /* Transforming phase to status */
    const filter: Record<string, any> = { ...query };
    if (filter.phase) {
      const phaseKey = filter.phase as Phase;
      const statuses = PHASE_TO_STATUSES[phaseKey];
      if (!statuses) {
        filter.status = { $in: PHASE_TO_STATUSES['unseen'] };
      } else if (!filter.status) {
        filter.status = { $in: statuses };
      }
    }
    delete filter.phase;

    if (filter.status === 'all') delete filter.status;

    if (filter.ucd === 'true') filter.isUCDavisStudent = true;
    else if (filter.ucd === 'false') filter.isUCDavisStudent = false;
    delete filter.ucd;

    /* Getting applications from DB */
    const parsedQuery = await parseAndReplace(filter);
    const db = await getDatabase();
    const col = db.collection('applications');

    const projection = options?.projection;
    const sort = options?.sort ?? { submittedAt: -1 };
    const limit = typeof options?.limit === 'number' ? options!.limit : 50;
    const skip = typeof options?.skip === 'number' ? options!.skip : 0;

    const cursor = col
      .find(parsedQuery, projection ? { projection } : undefined)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const applications = await cursor.toArray();

    return {
      ok: true,
      body: applications,
      returned: applications.length,
      error: null,
    };
  } catch (e) {
    const error = e as HttpError;
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
};
