import { ObjectId } from 'mongodb';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import {
  HttpError,
  NotFoundError,
  NoContentError,
  BadRequestError,
} from '@utils/response/Errors';

export const UpdateUser = async (id: string, body: object) => {
  try {
    const object_id = new ObjectId(id);
    if (isBodyEmpty(body)) {
      throw new NoContentError();
    }

    const parsedBody = await parseAndReplace(body);

    const db = await getDatabase();

    // check for duplicate email or second admin
    if (parsedBody.$set.email) {
      const existingUserWithEmail = await db.collection('users').findOne({
        $and: [{ email: parsedBody.$set.email }, { _id: { $ne: object_id } }],
      });
      if (existingUserWithEmail) {
        throw new BadRequestError(
          `Duplicate: user email ${parsedBody.$set.email} already in use by another user.`
        );
      }
    }
    if (parsedBody.$set.role === 'admin') {
      const existingAdmin = await db
        .collection('users')
        .findOne({ role: 'admin' });
      if (existingAdmin) {
        throw new BadRequestError('Duplicate: Only one admin is allowed.');
      }
    }

    const user = await db
      .collection('users')
      .updateOne({ _id: object_id }, parsedBody);

    if (user.matchedCount === 0) {
      throw new NotFoundError(`user with id: ${id} not found.`);
    }

    return { ok: true, body: user, error: null };
  } catch (e) {
    const error = e as HttpError;
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
};
