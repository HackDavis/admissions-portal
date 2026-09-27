import type { Application, WaitlistPool } from '../_types/application';

export const AUTOMATIC_WAITLIST_STUDY_LEVELS = [
  'Graduate University (Masters, Professional, Doctoral, etc)',
  'Code School / Bootcamp',
  'Other Vocational / Trade Program or Apprenticeship',
  'Post Doctorate',
] as const;

export function automaticWaitlistReasons(app: {
  isOver18?: boolean | null;
  levelOfStudy?: string;
}): string[] {
  const reasons: string[] = [];
  if (app.isOver18 !== true) {
    reasons.push('Not confirmed 18 or older');
  }
  if (
    AUTOMATIC_WAITLIST_STUDY_LEVELS.some((level) => level === app.levelOfStudy)
  ) {
    reasons.push(`Study level: ${app.levelOfStudy}`);
  }
  return reasons;
}

export function getWaitlistPool(app: Application): WaitlistPool | null {
  if (
    [
      'tentatively_accepted',
      'tentatively_waitlist_accepted',
      'tentatively_waitlist_rejected',
      'accepted',
      'waitlist_accepted',
      'waitlist_rejected',
    ].includes(app.status)
  )
    return null;
  if (
    (app.status === 'pending' || app.status === 'tentatively_waitlisted') &&
    !app.waitlistPool &&
    !app.decisionSource &&
    !app.reviewedAt &&
    automaticWaitlistReasons(app).length > 0
  ) {
    return 'automatic';
  }
  if (app.status === 'pending') {
    return null;
  }
  if (['waitlisted', 'tentatively_waitlisted'].includes(app.status)) {
    return (
      app.waitlistPool ??
      (app.decisionSource === 'automatic' ? 'automatic' : 'probably_waitlist')
    );
  }
  return null;
}

export function partitionWaitlist(apps: Application[]) {
  const pools: Record<WaitlistPool, Application[]> = {
    probable_accept: [],
    probably_waitlist: [],
    automatic: [],
  };
  const regular: Application[] = [];
  for (const app of apps) {
    const pool = getWaitlistPool(app);
    if (pool) pools[pool].push(app);
    else regular.push(app);
  }
  return { pools, regular };
}
