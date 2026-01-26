import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { HttpError, NotFoundError } from '@utils/response/Errors';
import { ObjectId } from 'mongodb';

export const GetMailchimp = async (id: string) => {
  try {
    const object_id = new ObjectId(id);
    const db = await getDatabase();

    const mailchimp = await db.collection('mailchimp').findOne({
      _id: object_id,
    });

    if (mailchimp === null) {
      throw new NotFoundError(`mailchimp with id: ${id} not found.`);
    }

    return { ok: true, body: mailchimp, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};
