export type Phase = 'unseen' | 'tentative' | 'processed';

export type Status =
  | 'pending'
  | 'tentatively_accepted'
  | 'tentatively_rejected'
  | 'tentatively_waitlisted'
  | 'accepted'
  | 'rejected'
  | 'waitlisted';

export type StatusFilter = 'all' | Status;

export type UcdParam = 'all' | 'true' | 'false';
export interface Application {
  id: string;
  email: string;
  isUCDavisStudent: boolean;
  status: Status;
  submittedAt?: string;
  reviewedAt?: string;
  processedAt?: string;
}
