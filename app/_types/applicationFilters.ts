export type Status =
  | 'pending'
  | 'tentatively_accepted'
  | 'tentatively_rejected'
  | 'tentatively_waitlisted'
  | 'accepted'
  | 'rejected'
  | 'waitlisted';

export type StatusFilter = 'all' | Status;

export type UcdStudentFilter = 'all' | 'true' | 'false';

export type Phase = 'unseen' | 'tentative' | 'processed';
