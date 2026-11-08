import { ObjectId } from 'mongodb';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { openResume } from '@utils/resumes/resumeStorage';
import { HttpError, NotFoundError } from '@utils/response/Errors';

export const GetApplicationResume = async (applicationId: string) => {
  try {
    if (!ObjectId.isValid(applicationId)) {
      throw new NotFoundError(
        `Application with id: ${applicationId} not found.`
      );
    }

    const db = await getDatabase();
    const application = await db
      .collection('applications')
      .findOne(
        { _id: new ObjectId(applicationId) },
        { projection: { resumeFileId: 1 } }
      );

    if (application === null) {
      throw new NotFoundError(
        `Application with id: ${applicationId} not found.`
      );
    }

    if (!application.resumeFileId) {
      throw new NotFoundError('This application has no uploaded resume.');
    }

    const resume = await openResume(application.resumeFileId);
    if (resume === null) {
      throw new NotFoundError('Resume file not found.');
    }

    return { ok: true, status: 200, body: resume, error: null };
  } catch (e) {
    if (e instanceof HttpError) {
      return { ok: false, status: e.status, body: null, error: e.message };
    }
    return {
      ok: false,
      status: 500,
      body: null,
      error: 'Could not load resume. Please try again.',
    };
  }
};
