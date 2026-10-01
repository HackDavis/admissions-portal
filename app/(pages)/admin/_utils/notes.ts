import { ApplicationNote } from '@/app/_types/application';

export function formatNoteTimestamp(timestamp: Date | string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function sortNotesByNewest(notes: ApplicationNote[]) {
  return [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
