/** @jest-environment node */

import { ObjectId } from 'mongodb';

const findOne = jest.fn();
const insertOne = jest.fn();
const attachResume = jest.fn();
const detachResume = jest.fn();

jest.mock('@utils/mongodb/mongoClient.mjs', () => ({
  getDatabase: async () => ({
    collection: () => ({
      findOne: (...args: unknown[]) => findOne(...args),
      insertOne: (...args: unknown[]) => insertOne(...args),
    }),
  }),
}));
jest.mock('@utils/resumes/resumeStorage', () => ({
  attachResume: (...args: unknown[]) => attachResume(...args),
  detachResume: (...args: unknown[]) => detachResume(...args),
}));

import { CreateApplication } from '@datalib/applications/createApplication';

const application = (extra: object = {}) => ({
  email: 'a@b.com',
  firstName: 'Alex',
  ...extra,
});

describe('CreateApplication resume handling', () => {
  beforeEach(() => {
    // 1st findOne is the duplicate check, 2nd reads the inserted application back
    findOne.mockResolvedValueOnce(null).mockResolvedValue({ _id: 'x' });
    insertOne.mockResolvedValue({ insertedId: new ObjectId() });
    attachResume.mockResolvedValue(true);
  });

  test('attaches the uploaded resume and saves its id', async () => {
    const res = await CreateApplication(
      application({ resumeFileId: 'file123' })
    );
    expect(res.ok).toBe(true);
    expect(attachResume).toHaveBeenCalledWith('file123');
    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ resumeFileId: 'file123' })
    );
  });

  test('rejects with an expiry message when the upload is gone, and saves nothing', async () => {
    attachResume.mockResolvedValue(false);
    const res = await CreateApplication(
      application({ resumeFileId: 'file123' })
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/expired/i);
    expect(insertOne).not.toHaveBeenCalled();
  });

  test('does not consume the resume when the applicant is a duplicate', async () => {
    findOne.mockReset();
    findOne.mockResolvedValue({ _id: 'existing' });
    const res = await CreateApplication(
      application({ resumeFileId: 'file123' })
    );
    expect(res.ok).toBe(false);
    expect(attachResume).not.toHaveBeenCalled();
  });

  test('detaches the resume when the insert fails, so a retry can reuse it', async () => {
    insertOne.mockRejectedValue(new Error('Document failed validation'));
    detachResume.mockResolvedValue(undefined);
    const res = await CreateApplication(
      application({ resumeFileId: 'file123' })
    );
    expect(res.ok).toBe(false);
    expect(detachResume).toHaveBeenCalledWith('file123');
  });

  test('saves applications without a resume and drops an empty resumeFileId', async () => {
    const res = await CreateApplication(application({ resumeFileId: '' }));
    expect(res.ok).toBe(true);
    expect(attachResume).not.toHaveBeenCalled();
    expect(insertOne.mock.calls[0][0]).not.toHaveProperty('resumeFileId');
  });
});
