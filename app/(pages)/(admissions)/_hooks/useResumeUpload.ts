'use client';

import { useState } from 'react';
import { RESUME_MAX_BYTES } from '../../../_utils/resumeLimits';

const UPLOAD_FAILED = 'Resume upload failed. Please try again.';

// Uploads happen as soon as a file is picked. onChange receives the stored file's id ('' when cleared).
export function useResumeUpload(onChange: (fileId: string) => void) {
  const [fileId, setFileId] = useState('');
  const [filename, setFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Best effort: a file that fails to delete is swept by the server after 24h
  const discard = (id: string) => {
    fetch(`/api/resumes/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const upload = async (file: File) => {
    setError(null);

    // Some systems report an empty type for real PDFs; the server checks the actual bytes
    const looksLikePdf =
      file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!looksLikePdf) {
      setError('Please choose a PDF file.');
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      setError('Your resume must be 4 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/resumes', { method: 'POST', body });
      const json = await res.json();

      if (!res.ok || !json.body?.fileId) {
        setError(json.error ?? UPLOAD_FAILED);
        return;
      }

      setFileId(json.body.fileId);
      setFilename(file.name);
      onChange(json.body.fileId);
    } catch {
      setError(UPLOAD_FAILED);
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    if (fileId) discard(fileId);
    setFileId('');
    setFilename('');
    setError(null);
    onChange('');
  };

  // Forget the file without deleting it (it is already gone server-side) and explain why
  const reset = (message: string) => {
    setFileId('');
    setFilename('');
    setError(message);
    onChange('');
  };

  return {
    fileId,
    filename,
    uploading,
    error,
    upload,
    remove,
    reset,
  };
}
