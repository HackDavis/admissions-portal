import { GridFSBucket, ObjectId } from 'mongodb';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';

// 4 MB; Vercel rejects request bodies over 4.5 MB
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;

// 1 day
const ORPHAN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const getBucket = async () =>
  new GridFSBucket(await getDatabase(), { bucketName: 'resumes' });

const getFiles = async () => (await getDatabase()).collection('resumes.files');

// Uploaded files start unattached; attachResume assigns an application when user finishes
export async function saveResume(buffer: Buffer, filename: string) {
  const bucket = await getBucket();
  const stream = bucket.openUploadStream(filename, {
    metadata: { attached: false, uploadedAt: new Date() },
  });

  await new Promise<void>((resolve, reject) => {
    stream.once('finish', () => resolve());
    stream.once('error', reject);
    stream.end(buffer);
  });

  return stream.id.toString();
}

// Returns null when the id is malformed or the file does not exist
export async function openResume(fileId: string) {
  if (!ObjectId.isValid(fileId)) return null;

  const _id = new ObjectId(fileId);
  const file = await (await getFiles()).findOne({ _id });
  if (!file) return null;

  const bucket = await getBucket();
  return { stream: bucket.openDownloadStream(_id), filename: file.filename };
}

// Only unattached files can be deleted, so a submitted application's resume is safe
export async function deleteUnattachedResume(fileId: string) {
  if (!ObjectId.isValid(fileId)) return false;

  const _id = new ObjectId(fileId);
  const file = await (
    await getFiles()
  ).findOne({ _id, 'metadata.attached': false });
  if (!file) return false;

  await (await getBucket()).delete(_id);
  return true;
}

// False when the file is missing or already attached, so one resume cannot attach to two applications
export async function attachResume(fileId: string) {
  if (!ObjectId.isValid(fileId)) return false;

  const result = await (
    await getFiles()
  ).updateOne(
    { _id: new ObjectId(fileId), 'metadata.attached': false },
    { $set: { 'metadata.attached': true } }
  );

  return result.matchedCount === 1;
}

// Called on resume uploads
export async function sweepOrphanedResumes() {
  const cutoff = new Date(Date.now() - ORPHAN_MAX_AGE_MS);
  const orphans = await (
    await getFiles()
  )
    .find({
      'metadata.attached': false,
      'metadata.uploadedAt': { $lt: cutoff },
    })
    .toArray();

  const bucket = await getBucket();
  await Promise.all(
    orphans.map((file: { _id: ObjectId }) => bucket.delete(file._id))
  );
  return orphans.length;
}
