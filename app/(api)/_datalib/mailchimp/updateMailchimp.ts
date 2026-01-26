import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { ObjectId } from 'mongodb';

import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import {
  HttpError,
  NoContentError,
  NotFoundError,
} from '@utils/response/Errors';

export const UpdateMailchimp = async (id: string, body: object) => {
  try {
    const object_id = new ObjectId(id);
    if (isBodyEmpty(body)) {
      throw new NoContentError();
    }
    const parsedBody = await parseAndReplace(body);

    const db = await getDatabase();
    const mailchimp = await db.collection('mailchimp').updateOne(
      {
        _id: object_id,
      },
      parsedBody
    );

    if (mailchimp.matchedCount === 0) {
      throw new NotFoundError(`Mailchimp with id: ${id} not found.`);
    }

    return { ok: true, body: mailchimp, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};
