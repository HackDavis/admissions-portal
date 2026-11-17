/** @jest-environment node */
import { ObjectId } from 'mongodb';

let records: any[] = [];
const removeFile = jest.fn();
let afterScan: (() => Promise<void>) | undefined;
const matches = (record: any, query: any) =>
  Object.entries(query).every(([key, value]: any) => {
    const actual = key
      .split('.')
      .reduce((obj: any, part: string) => obj?.[part], record);
    if (value instanceof ObjectId) return value.equals(actual);
    if (value && typeof value === 'object') {
      if ('$ne' in value) return actual !== value.$ne;
      if ('$lt' in value) return actual < value.$lt;
    }
    return actual === value;
  });
const files = {
  updateOne: jest.fn(async (query, update) => {
    const record = records.find((r) => matches(r, query));
    if (!record) return { matchedCount: 0 };
    Object.entries(update.$set).forEach(([key, value]) => {
      record.metadata[key.split('.')[1]] = value;
    });
    return { matchedCount: 1 };
  }),
  find: (query: any) => ({
    limit: (count: number) => ({
      toArray: async () => {
        const found = records
          .filter((r) => matches(r, query))
          .slice(0, count)
          .map((r) => ({ ...r }));
        await afterScan?.();
        return found;
      },
    }),
  }),
};
jest.mock('@utils/mongodb/mongoClient.mjs', () => ({
  getDatabase: async () => ({ collection: () => files }),
}));
jest.mock('mongodb', () => ({
  ...jest.requireActual('mongodb'),
  GridFSBucket: jest.fn().mockImplementation(() => ({
    delete: (...args: unknown[]) => removeFile(...args),
  })),
}));
import {
  attachResume,
  deleteUnattachedResume,
  sweepOrphanedResumes,
} from '@utils/resumes/resumeStorage';
const addFile = () => {
  const file = {
    _id: new ObjectId(),
    metadata: { attached: false, uploadedAt: new Date(0) },
  };
  records.push(file);
  return file;
};
beforeEach(() => {
  records = [];
  afterScan = undefined;
  removeFile.mockReset().mockResolvedValue(undefined);
});
test('attachment wins: removal cannot delete an attached resume', async () => {
  const file = addFile();
  expect(await attachResume(file._id.toString())).toBe(true);
  expect(await deleteUnattachedResume(file._id.toString())).toBe(false);
  expect(removeFile).not.toHaveBeenCalled();
});
test('deletion wins: attachment is rejected while deletion is in progress', async () => {
  const file = addFile();
  removeFile.mockImplementation(async () => {
    expect(await attachResume(file._id.toString())).toBe(false);
  });
  expect(await deleteUnattachedResume(file._id.toString())).toBe(true);
});
test('sweep rechecks files attached after its initial scan', async () => {
  const file = addFile();
  afterScan = async () => {
    await attachResume(file._id.toString());
  };
  expect(await sweepOrphanedResumes()).toBe(0);
  expect(removeFile).not.toHaveBeenCalled();
});
test('sweep claims files before deletion and limits each batch to ten', async () => {
  for (let i = 0; i < 15; i++) addFile();
  removeFile.mockImplementation(async (id: ObjectId) => {
    expect(await attachResume(id.toString())).toBe(false);
  });
  expect(await sweepOrphanedResumes()).toBe(10);
  expect(removeFile).toHaveBeenCalledTimes(10);
});
test('failed deletion remains unavailable for attachment and can be retried', async () => {
  const file = addFile();
  removeFile.mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(deleteUnattachedResume(file._id.toString())).rejects.toThrow();
  expect(await attachResume(file._id.toString())).toBe(false);
  expect(await sweepOrphanedResumes()).toBe(1);
});
