import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import parseAndReplace from '@utils/request/parseAndReplace';
import { HttpError, NotFoundError } from '@utils/response/Errors';
import { ObjectId } from 'mongodb';

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
    const parsedQuery = await parseAndReplace(query);
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
