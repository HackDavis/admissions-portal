import { Phase, Status } from '@/app/_types/applicationFilters';

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'unseen', label: 'unseen' },
  { id: 'tentative', label: 'tentative' },
  { id: 'processed', label: 'processed' },
];

export const TENTATIVE_STATUSES: Status[] = [
  'tentatively_accepted',
  'tentatively_rejected',
  'tentatively_waitlisted',
];

export const PROCESSED_STATUSES: Status[] = [
  'accepted',
  'rejected',
  'waitlisted',
];
