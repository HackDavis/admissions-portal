'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

import { ApplicationNote } from '@/app/_types/application';
import {
  addApplicationNote,
  updateApplicationNote,
} from '@actions/applications/applicationNotes';
import { formatNoteTimestamp, sortNotesByNewest } from '../_utils/notes';

interface ApplicantNotesProps {
  applicationId: string;
  notes: ApplicationNote[];
  onNotesChange: (notes: ApplicationNote[]) => void;
}

export default function ApplicantNotes({
  applicationId,
  notes,
  onNotesChange,
}: ApplicantNotesProps) {
  const { data: session } = useSession();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = session?.user?.id;
  const sortedNotes = sortNotesByNewest(notes);

  const handleAdd = async () => {
    setPending(true);
    setError(null);

    const res = await addApplicationNote(applicationId, draft);

    if (res.ok && res.body) {
      onNotesChange(res.body);
      setDraft('');
    } else {
      setError(res.error ?? 'Failed to add note.');
    }

    setPending(false);
  };

  const handleSaveEdit = async (noteId: string) => {
    setPending(true);
    setError(null);

    const res = await updateApplicationNote(applicationId, noteId, editDraft);

    if (res.ok && res.body) {
      onNotesChange(res.body);
      setEditingId(null);
      setEditDraft('');
    } else {
      setError(res.error ?? 'Failed to update note.');
    }

    setPending(false);
  };

  const startEditing = (note: ApplicationNote) => {
    setEditingId(note._id);
    setEditDraft(note.body);
    setError(null);
  };

  return (
    <section className="mt-3 border-2 border-black p-2">
      <h4 className="text-[10px] font-semibold uppercase">
        internal notes ({notes.length})
      </h4>
      <p className="mb-2 text-[10px]">
        visible to admins only. applicants never see these.
      </p>

      <div className="mb-2 flex flex-col gap-1">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="add a note..."
          rows={2}
          className="border border-black p-1 text-xs"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || !draft.trim()}
          className="self-start border border-black px-2 py-1 text-[10px] uppercase disabled:opacity-40"
        >
          {pending ? 'saving...' : 'add note'}
        </button>
      </div>

      {error && <p className="mb-2 text-[10px] text-red-600">{error}</p>}

      {sortedNotes.length === 0 ? (
        <p className="text-xs">no notes yet...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedNotes.map((note) => (
            <li key={note._id} className="border border-black p-2">
              <p className="text-[10px] font-semibold uppercase">
                {note.authorEmail} · {formatNoteTimestamp(note.createdAt)}
                {note.updatedAt ? ' (edited)' : ''}
              </p>

              {editingId === note._id ? (
                <div className="mt-1 flex flex-col gap-1">
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={2}
                    className="border border-black p-1 text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(note._id)}
                      disabled={pending || !editDraft.trim()}
                      className="border border-black px-2 py-1 text-[10px] uppercase disabled:opacity-40"
                    >
                      save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="border border-black px-2 py-1 text-[10px] uppercase"
                    >
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 whitespace-pre-wrap text-xs">
                    {note.body}
                  </p>
                  {note.authorId === currentUserId && (
                    <button
                      type="button"
                      onClick={() => startEditing(note)}
                      className="mt-1 border border-black px-2 py-1 text-[10px] uppercase"
                    >
                      edit
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
