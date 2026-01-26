import { Phase, Status } from '@/app/_types/applicationFilters';

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'unseen', label: 'needs processing' },
  { id: 'tentative', label: 'tentative' },
  { id: 'processed', label: 'processed' },
];

export const TENTATIVE_STATUSES: Status[] = [
  'tentatively_accepted',
  'tentatively_waitlisted',
  'tentatively_waitlist_accepted',
  'tentatively_waitlist_rejected',
];

export const PROCESSED_STATUSES: Status[] = [
  'accepted',
  'waitlist_accepted',
  'waitlist_rejected',
];
