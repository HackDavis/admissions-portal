'use client';

import { useState } from 'react';
import type {
  Application,
  ApplicationStatusUpdateResult,
  WaitlistPool,
} from '@/app/_types/application';
import type { Phase, Status } from '@/app/_types/applicationFilters';
import { automaticWaitlistReasons } from '../../../_utils/waitlist';
import PhaseColumn from './PhaseColumn';

interface Props {
  pools: Record<WaitlistPool, Application[]>;
  isLoading: boolean;
  onUpdateStatus: (
    id: string,
    status: Status,
    phase: Phase,
    options?: {
      wasWaitlisted?: boolean;
      refreshPhase?: Phase;
      waitlistPool?: WaitlistPool;
    }
  ) => Promise<ApplicationStatusUpdateResult>;
}

const columns = [
  { id: 'probable_accept', label: 'Manual waitlist — probable accept' },
  {
    id: 'probably_waitlist',
    label: 'Manual waitlist — probably waitlist / reject',
  },
  { id: 'automatic', label: 'Automatic waitlist — needs review' },
] as const;

function phaseOf(app: Application): Phase {
  if (app.status.startsWith('tentatively_')) return 'tentative';
  if (app.status === 'waitlist_rejected') return 'processed';
  return 'unseen';
}

export default function AutoWaitlistApplications({
  pools,
  isLoading,
  onUpdateStatus,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function decide(app: Application, status: Status, pool?: WaitlistPool) {
    setBusy(true);
    setMessage('');
    try {
      const result = await onUpdateStatus(app._id, status, phaseOf(app), {
        wasWaitlisted: true,
        refreshPhase: status.startsWith('tentatively_')
          ? 'tentative'
          : status === 'waitlist_rejected'
          ? 'processed'
          : 'unseen',
        ...(pool ? { waitlistPool: pool } : {}),
      });
      if (!result.ok) setMessage(result.error);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save decision.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="space-y-3 border-t-4 border-black pt-6"
      aria-label="Waitlist pools"
    >
      <h2 className="font-medium">Waitlist Pools</h2>
      {message && (
        <p
          role="status"
          className="whitespace-pre-wrap border border-black p-2 text-xs"
        >
          {message}
        </p>
      )}
      <fieldset
        disabled={busy || isLoading}
        className="grid min-w-0 gap-4 md:grid-cols-3 disabled:opacity-70"
      >
        <legend className="sr-only">Review waitlisted applicants</legend>
        {columns.map(({ id, label }) => (
          <div
            key={id}
            className={
              id === 'automatic'
                ? 'border-t-4 border-dashed border-gray-500 pt-4 md:border-l-4 md:border-t-0 md:pl-4 md:pt-0'
                : ''
            }
          >
            <PhaseColumn
              phase="unseen"
              label={label}
              apps={pools[id]}
              isLoading={isLoading}
              renderActions={(app) => (
                <>
                  {id === 'automatic' && (
                    <p className="w-full text-xs text-amber-800">
                      Flagged:{' '}
                      {(
                        app.automaticReasons ?? automaticWaitlistReasons(app)
                      ).join('; ')}
                    </p>
                  )}
                  {id !== 'probable_accept' && (
                    <button
                      type="button"
                      className="special-button px-2 py-1 text-xs"
                      onClick={() =>
                        decide(
                          app,
                          app.status === 'tentatively_waitlisted'
                            ? app.status
                            : 'waitlisted',
                          'probable_accept'
                        )
                      }
                    >
                      Move to probable accept
                    </button>
                  )}
                  {id !== 'probably_waitlist' && (
                    <button
                      type="button"
                      className="special-button px-2 py-1 text-xs"
                      onClick={() =>
                        decide(
                          app,
                          app.status === 'tentatively_waitlisted'
                            ? app.status
                            : 'waitlisted',
                          'probably_waitlist'
                        )
                      }
                    >
                      Move to probably waitlist / reject
                    </button>
                  )}
                  {id !== 'automatic' && (
                    <button
                      type="button"
                      className="border border-green-700 bg-green-100 px-2 py-1 text-xs"
                      onClick={() =>
                        decide(app, 'tentatively_waitlist_accepted')
                      }
                    >
                      Accept for finalization
                    </button>
                  )}
                  {id === 'probably_waitlist' &&
                    app.status !== 'waitlist_rejected' && (
                      <button
                        type="button"
                        className="border border-red-700 bg-red-100 px-2 py-1 text-xs"
                        onClick={() =>
                          decide(
                            app,
                            'tentatively_waitlist_rejected',
                            'probably_waitlist'
                          )
                        }
                      >
                        Reject for finalization
                      </button>
                    )}
                </>
              )}
            />
          </div>
        ))}
      </fieldset>
    </section>
  );
}
