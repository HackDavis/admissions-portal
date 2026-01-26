export type Status =
  | 'pending'
  | 'tentatively_accepted'
  | 'tentatively_rejected'
  | 'tentatively_waitlisted'
  | 'tentative_waitlist_accept'
  | 'tentative_waitlist_reject'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'
  | 'waitlist_accept'
  | 'waitlist_reject';

export type StatusFilter = 'all' | Status;

export type UcdStudentFilter = 'all' | 'true' | 'false';

export type Phase = 'unseen' | 'tentative' | 'processed';
