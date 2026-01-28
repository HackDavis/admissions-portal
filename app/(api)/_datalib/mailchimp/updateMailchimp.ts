import { getDatabase } from '@utils/mongodb/mongoClient.mjs';

import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import { HttpError, NoContentError } from '@utils/response/Errors';

export const UpdateMailchimp = async (body: any) => {
  try {
    if (isBodyEmpty(body)) {
      throw new NoContentError();
    }
    const parsedBody = await parseAndReplace(body);

    const db = await getDatabase();

    const update: any = {};

    // If we passed apiCallsMade: 1, use $inc. Otherwise, use $set.
    if (parsedBody.apiCallsMade !== undefined) {
      update.$inc = { apiCallsMade: parsedBody.apiCallsMade };
      delete parsedBody.apiCallsMade;
    }

    if (Object.keys(parsedBody).length > 0) {
      update.$set = parsedBody;
    }

    const mailchimp = await db
      .collection('mailchimp')
      .findOneAndUpdate({}, update, {
        returnDocument: 'after',
        upsert: true, // Creates the doc if it doesn't exist
      });

    return { ok: true, body: mailchimp, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};
