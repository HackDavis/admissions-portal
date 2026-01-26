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
import { ApplicationUpdatePayload } from '@/app/_types/application';

const TENTATIVE_STATUSES = [
  'tentatively_accepted',
  'tentatively_rejected',
  'tentatively_waitlisted',
  'tentative_waitlist_accept',
  'tentative_waitlist_reject',
];
const PROCESSED_STATUSES = [
  'accepted',
  'rejected',
  'waitlist_accept',
  'waitlist_reject',
];
const ALL_STATUSES = [
  'pending',
  'waitlisted',
  ...TENTATIVE_STATUSES,
  ...PROCESSED_STATUSES,
];

export const UpdateApplication = async (
  id: string,
  body: ApplicationUpdatePayload
) => {
  try {
    // empty
    if (isBodyEmpty(body)) {
      throw new NoContentError();
    }

    const updateData = { ...body };

    if (updateData.status && !ALL_STATUSES.includes(updateData.status)) {
      throw new Error(`Invalid status: "${updateData.status}".`);
    }

    const now = new Date().toISOString();
    if (TENTATIVE_STATUSES.includes(updateData.status)) {
      updateData.reviewedAt = now;
    }
    if (PROCESSED_STATUSES.includes(updateData.status)) {
      updateData.processedAt = now;
    }

    const parsedBody = await parseAndReplace(updateData);

    const db = await getDatabase();

    // Only check duplicates if updating email
    const object_id = new ObjectId(id);
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

    const filter: any = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const result = await db
      .collection('applications')
      .updateOne(filter, { $set: parsedBody });

    if (result.matchedCount === 0) {
      throw new NotFoundError(`Application with id: ${id} not found.`);
    }

    return {
      ok: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      error: null,
    };
  } catch (e) {
    const error = e as HttpError;
    return {
      ok: false,
      matchedCount: 0,
      modifiedCount: 0,
      error: error.message,
    };
  }
};
