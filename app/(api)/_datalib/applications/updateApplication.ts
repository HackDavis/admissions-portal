import { ObjectId } from 'mongodb';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import {
  HttpError,
  NotFoundError,
  NoContentError,
  DuplicateError,
} from '@utils/response/Errors';

export const UpdateApplication = async (id: string, body: object) => {
  try {
    const object_id = new ObjectId(id);

    // empty
    if (isBodyEmpty(body)) {
      throw new NoContentError();
    }

    const parsedBody = await parseAndReplace(body); // Delete if application has no id fields?

    const db = await getDatabase();

    // Only check duplicates if updating email
    if (parsedBody.email) {
      const hasDuplicate = await db.collection('applications').findOne({
        $and: [{ _id: { $ne: object_id } }, { email: parsedBody.email }],
      });
      if (hasDuplicate) {
        throw new DuplicateError(
          'Duplicate Error: applicant already submitted.'
        );
      }
    }

    const application = await db
      .collection('applications')
      .updateOne({ _id: object_id }, { $set: parsedBody });

    if (application.matchedCount === 0) {
      throw new NotFoundError(`Application with id: ${id} not found.`);
    }

    return { ok: true, body: application, error: null };
  } catch (e) {
    const error = e as HttpError;
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
};
