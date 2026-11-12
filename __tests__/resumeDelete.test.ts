/** @jest-environment node */

const deleteUnattachedResume = jest.fn();

jest.mock('@utils/resumes/resumeStorage', () => ({
  deleteUnattachedResume: (...args: unknown[]) =>
    deleteUnattachedResume(...args),
}));

import { DeleteResume } from '@datalib/resumes/deleteResume';

describe('DeleteResume', () => {
  test('deletes an unattached resume', async () => {
    deleteUnattachedResume.mockResolvedValue(true);
    const res = await DeleteResume('file123');
    expect(res).toMatchObject({ ok: true, status: 200 });
    expect(deleteUnattachedResume).toHaveBeenCalledWith('file123');
  });

  test('returns 404 when the file is missing or already attached', async () => {
    deleteUnattachedResume.mockResolvedValue(false);
    const res = await DeleteResume('file123');
    expect(res).toMatchObject({ ok: false, status: 404 });
  });

  test('returns 500 with a generic message when storage fails', async () => {
    deleteUnattachedResume.mockRejectedValue(new Error('mongo://secret down'));
    const res = await DeleteResume('file123');
    expect(res).toMatchObject({ ok: false, status: 500 });
    expect(res.error).not.toMatch(/secret/);
  });
});
