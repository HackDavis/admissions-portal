'use client';

import { Application, Status } from '../_types';

// TODO: Add Mailchimp + HackerHub invite flow here.

interface FinalizeButtonProps {
  apps: Application[];
  onFinalizeStatus: (
    appId: string,
    nextStatus: Status,
    fromPhase: 'tentative',
    options?: { wasWaitlisted?: boolean; refreshPhase?: 'processed' }
  ) => void;
}

const FINAL_STATUS_MAP: Record<string, Status> = {
  tentatively_accepted: 'accepted',
  tentatively_rejected: 'rejected',
  tentatively_waitlisted: 'waitlisted',
};

export default function FinalizeButton({
  apps,
  onFinalizeStatus,
}: FinalizeButtonProps) {
  const handleFinalize = async () => {
    const updates = apps
      .filter((app) => app.status in FINAL_STATUS_MAP)
      .map((app) =>
        onFinalizeStatus(app.id, FINAL_STATUS_MAP[app.status], 'tentative', {
          wasWaitlisted: app.status === 'tentatively_waitlisted',
          refreshPhase: 'processed',
        })
      );

    await Promise.all(updates);
  };

  return (
    <button
      type="button"
      className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
      title="finalize tentative applicants"
      onClick={handleFinalize}
      disabled={apps.length === 0}
    >
      finalize
    </button>
  );
}
