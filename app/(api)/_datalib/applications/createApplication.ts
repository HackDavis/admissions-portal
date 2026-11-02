import { ObjectId } from 'mongodb';
import { automaticWaitlistReasons } from '../../../_utils/waitlist';

import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import { attachResume, detachResume } from '@utils/resumes/resumeStorage';
import {
  HttpError,
  NoContentError,
  DuplicateError,
  BadRequestError,
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

    // Fails if the upload was swept or someone sends another applicant's attached fileId
    if (parsedBody.resumeFileId) {
      const attached =
        typeof parsedBody.resumeFileId === 'string' &&
        (await attachResume(parsedBody.resumeFileId));

      if (!attached) {
        throw new BadRequestError(
          'Your resume upload expired. Please upload it again.'
        );
      }
    }

    const automaticReasons = automaticWaitlistReasons(parsedBody);
    const submission = { ...parsedBody };
    if (!submission.resumeFileId) delete submission.resumeFileId;
    for (const key of [
      'notes',
      'decisionSource',
      'waitlistPool',
      'reviewedAt',
      'processedAt',
      'batchNumber',
    ])
      delete submission[key];
    const parsedBodyWithTimestamp = {
      ...submission,
      status: automaticReasons.length ? 'waitlisted' : 'pending',
      wasWaitlisted: automaticReasons.length > 0,
      ...(automaticReasons.length
        ? {
            decisionSource: 'automatic',
            waitlistPool: 'automatic',
          }
        : {}),
      automaticReasons,
      submittedAt: new Date(),
    };

    let creationStatus;
    try {
      creationStatus = await db
        .collection('applications')
        .insertOne(parsedBodyWithTimestamp);
    } catch (insertError) {
      // Release the claimed resume so a retry can attach it again
      if (submission.resumeFileId) {
        await detachResume(submission.resumeFileId).catch((detachError) =>
          console.error(
            'Failed to detach resume after failed insert',
            detachError
          )
        );
      }
      throw insertError;
    }
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
