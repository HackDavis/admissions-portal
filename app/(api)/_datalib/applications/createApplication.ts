import { ObjectId } from 'mongodb';

import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import {
  HttpError,
  NoContentError,
  DuplicateError,
} from '@utils/response/Errors';

export const CreateApplication = async (body: object) => {
  try {
    // empty
    if (isBodyEmpty(body)) {
      throw new NoContentError();
    }

    const parsedBody = await parseAndReplace(body); // Delete if application has no id fields?

    const db = await getDatabase();

    // unique values have duplicate
    const hasDuplicate = await db.collection('applications').findOne({
      email: parsedBody.email,
    });

    if (hasDuplicate) {
      throw new DuplicateError('Duplicate Error: applicant already submitted.');
    }

    const parsedBodyWithTimestamp = {
      ...parsedBody,
      submittedAt: new Date(),
    };

    const creationStatus = await db
      .collection('applications')
      .insertOne(parsedBodyWithTimestamp);
    const application = await db.collection('applications').findOne({
      _id: new ObjectId(creationStatus.insertedId),
    });

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
