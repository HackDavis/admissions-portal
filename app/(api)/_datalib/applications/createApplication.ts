import { Db, ObjectId } from 'mongodb';
import { automaticWaitlistReasons } from '../../../_utils/waitlist';

import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import isBodyEmpty from '@utils/request/isBodyEmpty';
import parseAndReplace from '@utils/request/parseAndReplace';
import {
  HttpError,
  NoContentError,
  DuplicateError,
} from '@utils/response/Errors';

import { cookies } from 'next/headers';

const UNATTRIBUTED = 'unattributed';

async function getReferralSource(db: Db): Promise<string> {
  try {
    const code = cookies().get('hd_ref')?.value;
    if (!code || !/^[0-9]{6}$/.test(code)) {
      return UNATTRIBUTED;
    }

    const referral = await db.collection('referrals').findOne({ code });
    return referral?.name ?? UNATTRIBUTED;
  } catch {
    return UNATTRIBUTED;
  }
}

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

    const automaticReasons = automaticWaitlistReasons(parsedBody);
    const submission = { ...parsedBody };
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
      referralSource: await getReferralSource(db),
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
