import { ObjectId } from 'mongodb';

import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import {
  HttpError,
  NoContentError,
  DuplicateError,
} from '@utils/response/Errors';

//import { UpdateApplication } from '@datalib/applications/updateApplication';
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
      $or: [
        { email: parsedBody.email },
        {
          $and: [
            { firstName: parsedBody.firstName },
            { lastName: parsedBody.lastName },
          ],
        },
      ],
    });

    if (hasDuplicate) {
      throw new DuplicateError('Duplicate Error: applicant already submitted.');
      /*console.log("Has duplicate, updating application instead.");
        const result = await UpdateApplication(parsedBody.id, parsedBody);
        return result;*/
    }

    const creationStatus = await db
      .collection('applications')
      .insertOne(parsedBody);
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
