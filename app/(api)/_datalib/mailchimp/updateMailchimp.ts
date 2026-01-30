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

    const update: any = { $inc: {}, $set: {} };

    const incrementableKeys = ['apiCallsMade', 'batchNumber', 'apiKeyIndex'];

    // If we passed incrementableKeys: 1, use $inc. Otherwise, use $set to RESET to 0.
    incrementableKeys.forEach((key) => {
      if (parsedBody[key] !== undefined) {
        // Use 0 to RESET
        if (parsedBody[key] === 0) {
          update.$set[key] = 0;
        } else {
          // Otherwise increment
          update.$inc[key] = parsedBody[key];
        }
        delete parsedBody[key];
      }
    });

    if (Object.keys(parsedBody).length > 0) {
      update.$set = { ...update.$set, ...parsedBody };
    }

    if (Object.keys(update.$inc).length === 0) delete update.$inc;
    if (Object.keys(update.$set).length === 0) delete update.$set;

    const mailchimp = await db
      .collection('mailchimp')
      .findOneAndUpdate({}, update, { returnDocument: 'after', upsert: true });

    return { ok: true, body: mailchimp, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};
