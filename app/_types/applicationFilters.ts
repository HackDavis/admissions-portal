export type Status =
  | 'pending'
  | 'tentatively_accepted'
  | 'tentatively_waitlisted'
  | 'tentatively_waitlist_accepted'
  | 'tentatively_waitlist_rejected'
  | 'accepted'
  | 'waitlisted'
  | 'waitlist_accepted'
  | 'waitlist_rejected';

export type StatusFilter = 'all' | Status;

export type UcdStudentFilter = 'all' | 'true' | 'false';

export type Phase = 'unseen' | 'tentative' | 'processed';

export const ACCEPTED_STATUSES = new Set([
  'accepted',
  'waitlist_accepted',
  'tentatively_accepted',
  'tentatively_waitlist_accepted',
]);

export const REJECTED_STATUSES = new Set([
  'waitlist_rejected',
  'tentatively_waitlist_rejected',
]);

export const UNDECIDED_STATUSES = new Set(['tentatively_waitlisted']);

export const PROCESSED_STATUSES = [
  'accepted',
  'waitlist_accepted',
  'waitlist_rejected',
] as const;

export const TENTATIVE_STATUSES = [
  'tentatively_accepted',
  'tentatively_waitlisted',
  'tentatively_waitlist_accepted',
  'tentatively_waitlist_rejected',
] as const;

export const HYPOTHETIC_STATUSES = [
  ...PROCESSED_STATUSES,
  ...TENTATIVE_STATUSES,
] as const;

export const PHASE_TO_STATUSES: Record<Phase, readonly string[]> = {
  unseen: ['pending', 'waitlisted'],
  tentative: TENTATIVE_STATUSES,
  processed: PROCESSED_STATUSES,
};

export const ALL_STATUSES = [
  'pending',
  'waitlisted',
  ...TENTATIVE_STATUSES,
  ...PROCESSED_STATUSES,
];

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'unseen', label: 'needs processing' },
  { id: 'tentative', label: 'tentative' },
  { id: 'processed', label: 'processed' },
];

export const UNSEEN_STATUSES: Status[] = ['pending', 'waitlisted'];
