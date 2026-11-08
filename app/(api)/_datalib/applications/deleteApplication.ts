import { ObjectId } from 'mongodb';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { deleteResume } from '@utils/resumes/resumeStorage';
import { HttpError, NotFoundError } from '@utils/response/Errors';

export const DeleteApplication = async (id: string) => {
  try {
    const object_id = new ObjectId(id);
    const db = await getDatabase();

    const deleted = await db.collection('applications').findOneAndDelete({
      _id: object_id,
    });

    if (!deleted) {
      throw new NotFoundError(`Application with id: ${id} not found.`);
    }

    // The application is already gone, so a failed file cleanup is logged instead of failing the request
    if (deleted.resumeFileId) {
      await deleteResume(deleted.resumeFileId).catch((cleanupError) =>
        console.error('Failed to delete resume of deleted application', {
          fileId: deleted.resumeFileId,
          cleanupError,
        })
      );
    }

    return { ok: true, body: 'Application deleted.', error: null };
  } catch (e) {
    const error = e as HttpError;
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
};
