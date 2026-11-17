import {
  RESUME_MAX_BYTES,
  saveResume,
  sweepOrphanedResumes,
} from '@utils/resumes/resumeStorage';
import { HttpError, BadRequestError } from '@utils/response/Errors';

// Checks file content to determine if it's a PDF
const isPdf = (buffer: Buffer) => buffer.subarray(0, 5).toString() === '%PDF-';

export const UploadResume = async (file: FormDataEntryValue | null) => {
  try {
    if (!(file instanceof File)) {
      throw new BadRequestError('No resume file was provided.');
    }

    if (file.size > RESUME_MAX_BYTES) {
      throw new BadRequestError('Resume must be 4 MB or smaller.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isPdf(buffer)) {
      throw new BadRequestError('Resume must be a PDF.');
    }

    const fileId = await saveResume(buffer, file.name.slice(0, 200));

    // If cleanup errors, it doesn't affect PDF upload
    await sweepOrphanedResumes().catch((e) =>
      console.error('Resume sweep failed', e)
    );

    return { ok: true, status: 200, body: { fileId }, error: null };
  } catch (e) {
    // Show PDF validation errors, if applicable
    if (e instanceof HttpError) {
      return { ok: false, status: e.status, body: null, error: e.message };
    }
    return {
      ok: false,
      status: 500,
      body: null,
      error: 'Resume upload failed. Please try again.',
    };
  }
};
