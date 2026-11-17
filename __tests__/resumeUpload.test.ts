/** @jest-environment node */

const saveResume = jest.fn();
const sweepOrphanedResumes = jest.fn();

jest.mock('@utils/resumes/resumeStorage', () => ({
  RESUME_MAX_BYTES: 4 * 1024 * 1024,
  saveResume: (...args: unknown[]) => saveResume(...args),
  sweepOrphanedResumes: (...args: unknown[]) => sweepOrphanedResumes(...args),
}));

import { UploadResume } from '@datalib/resumes/uploadResume';

const MAX = 4 * 1024 * 1024;

const makeFile = (content: Buffer | string, name = 'resume.pdf') =>
  new File([content as BlobPart], name, { type: 'application/pdf' });

const pdf = (totalBytes: number) =>
  Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(totalBytes - 9, 'a')]);

describe('UploadResume', () => {
  beforeEach(() => {
    saveResume.mockResolvedValue('file123');
    sweepOrphanedResumes.mockResolvedValue(0);
  });

  test('accepts a valid PDF and returns its file id', async () => {
    const res = await UploadResume(makeFile(pdf(1024)));
    expect(res).toEqual({
      ok: true,
      status: 200,
      body: { fileId: 'file123' },
      error: null,
    });
    expect(saveResume).toHaveBeenCalledWith(expect.any(Buffer), 'resume.pdf');
  });

  test('accepts a PDF of exactly 4 MB', async () => {
    const res = await UploadResume(makeFile(pdf(MAX)));
    expect(res.ok).toBe(true);
  });

  test('rejects a file over 4 MB with 400', async () => {
    const res = await UploadResume(makeFile(pdf(MAX + 1)));
    expect(res).toMatchObject({ ok: false, status: 400 });
    expect(res.error).toMatch(/4 MB/);
    expect(saveResume).not.toHaveBeenCalled();
  });

  test('rejects a non-PDF even when named .pdf', async () => {
    const res = await UploadResume(makeFile('just some text'));
    expect(res).toMatchObject({ ok: false, status: 400 });
    expect(res.error).toMatch(/PDF/);
    expect(saveResume).not.toHaveBeenCalled();
  });

  test('rejects a request with no file', async () => {
    const res = await UploadResume(null);
    expect(res).toMatchObject({ ok: false, status: 400 });
  });

  test('still succeeds when the orphan sweep fails', async () => {
    sweepOrphanedResumes.mockRejectedValue(new Error('boom'));
    const res = await UploadResume(makeFile(pdf(1024)));
    expect(res.ok).toBe(true);
  });
});
