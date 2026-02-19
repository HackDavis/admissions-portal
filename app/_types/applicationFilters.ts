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

export const FINAL_STATUS_MAP: Record<string, Status> = {
  tentatively_accepted: 'accepted',
  tentatively_waitlisted: 'waitlisted',
  tentatively_waitlist_accepted: 'waitlist_accepted',
  tentatively_waitlist_rejected: 'waitlist_rejected',
};

export const WAITLIST_STATUSES = [
  'tentatively_waitlisted',
  'tentatively_waitlist_accepted',
  'tentatively_waitlist_rejected',
];

export type StatusFilter = 'all' | Status;

export type UcdStudentFilter = 'all' | 'true' | 'false';

export type Phase = 'unseen' | 'tentative' | 'processed';
