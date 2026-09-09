import { ObjectId } from 'mongodb';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import {
  HttpError,
  BadRequestError,
  NotFoundError,
} from '@utils/response/Errors';
import { ApplicationNote } from '@/app/_types/application';

export const NOTE_MAX_LENGTH = 2000;

const applicationFilter = (id: string) =>
  ObjectId.isValid(id)
    ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
    : { _id: id };

const validateBody = (body: string) => {
  const trimmed = typeof body === 'string' ? body.trim() : '';

  if (!trimmed) {
    throw new BadRequestError('Note cannot be empty.');
  }

  if (trimmed.length > NOTE_MAX_LENGTH) {
    throw new BadRequestError(
      `Note cannot be longer than ${NOTE_MAX_LENGTH} characters.`
    );
  }

  return trimmed;
};

// Notes are returned in full after every write so the admin UI can resync without refetching the application.
const getNotes = async (id: string): Promise<ApplicationNote[]> => {
  const db = await getDatabase();
  const application = await db
    .collection('applications')
    .findOne(applicationFilter(id), { projection: { notes: 1 } });

  if (application === null) {
    throw new NotFoundError(`Application with id: ${id} not found.`);
  }

  return (application.notes ?? []) as ApplicationNote[];
};

export const AddApplicationNote = async (
  id: string,
  author: { id: string; email: string },
  body: string
) => {
  try {
    const note: ApplicationNote = {
      _id: new ObjectId().toString(),
      body: validateBody(body),
      authorId: author.id,
      authorEmail: author.email,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    const result = await db
      .collection('applications')
      .updateOne(applicationFilter(id), { $push: { notes: note } });

    if (result.matchedCount === 0) {
      throw new NotFoundError(`Application with id: ${id} not found.`);
    }

    return { ok: true, body: await getNotes(id), error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};

export const UpdateApplicationNote = async (
  id: string,
  noteId: string,
  authorId: string,
  body: string
) => {
  try {
    const trimmed = validateBody(body);

    const db = await getDatabase();
    // Matching on authorId keeps a note editable only by whoever wrote it.
    const result = await db.collection('applications').updateOne(
      applicationFilter(id),
      {
        $set: {
          'notes.$[note].body': trimmed,
          'notes.$[note].updatedAt': new Date(),
        },
      },
      { arrayFilters: [{ 'note._id': noteId, 'note.authorId': authorId }] }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError(`Application with id: ${id} not found.`);
    }

    if (result.modifiedCount === 0) {
      throw new NotFoundError('Note not found, or you are not its author.');
    }

    return { ok: true, body: await getNotes(id), error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};
