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

export const GetManyApplications = async (query: object = {}) => {
  try {
    const parsedQuery = await parseAndReplace(query);

    const db = await getDatabase();

    const applications = await db
      .collection('applications')
      .aggregate([
        {
          $match: parsedQuery,
        },
        /*{
          $lookup: {
            from: '<table>',
            localField: '<field here>',
            foreignField: '<field there>',
            as: '<name of array>',
          },
        }*/
      ])
      .toArray();

    return { ok: true, body: applications, error: null };
  } catch (e) {
    const error = e as HttpError;
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
};
