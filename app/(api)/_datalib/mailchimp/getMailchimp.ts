import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { HttpError, NotFoundError } from '@utils/response/Errors';

// Gets a single mailchimp document
export const GetMailchimp = async () => {
  try {
    const db = await getDatabase();

    const mailchimp = await db.collection('mailchimp').findOne({}); // there should only be one document in db

    if (!mailchimp) {
      throw new NotFoundError('mailchimp document not found.');
    }

    return { ok: true, body: mailchimp, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};
