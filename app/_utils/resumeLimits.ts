// 4 MB; Vercel rejects request bodies over 4.5 MB
// Shared by the upload API and the application form
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;

// Returned when a submitted application references an upload that was swept or already used
export const RESUME_EXPIRED_MESSAGE =
  'Your resume upload expired. Please upload it again.';
