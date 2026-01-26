import { Phase, Status } from '@/app/_types/applicationFilters';

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'unseen', label: 'needs processing' },
  { id: 'tentative', label: 'tentative' },
  { id: 'processed', label: 'processed' },
];

export const TENTATIVE_STATUSES: Status[] = [
  'tentatively_accepted',
  'tentatively_rejected',
  'tentatively_waitlisted',
  'tentative_waitlist_accept',
  'tentative_waitlist_reject',
];

export const PROCESSED_STATUSES: Status[] = [
  'accepted',
  'rejected',
  'waitlist_accept',
  'waitlist_reject',
];
