import { deleteUnattachedResume } from '@utils/resumes/resumeStorage';
import { HttpError, NotFoundError } from '@utils/response/Errors';

export const DeleteResume = async (fileId: string) => {
  try {
    if (!(await deleteUnattachedResume(fileId))) {
      throw new NotFoundError('Resume not found.');
    }

    return { ok: true, status: 200, body: 'Resume deleted.', error: null };
  } catch (e) {
    if (e instanceof HttpError) {
      return { ok: false, status: e.status, body: null, error: e.message };
    }
    return {
      ok: false,
      status: 500,
      body: null,
      error: 'Could not delete resume. Please try again.',
    };
  }
};
