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
