'use client';

import { Application } from '@/app/_types/application';
import { Phase, Status, StatusFilter } from '@/app/_types/applicationFilters';
import {
  PHASES,
  PROCESSED_STATUSES,
  TENTATIVE_STATUSES,
  UNSEEN_STATUSES,
} from '@/app/_types/applicationFilters';
import FinalizeButton from './FinalizeButton';
import PhaseColumn from './PhaseColumn';

interface ApplicationsGridProps {
  appsByPhase: Record<Phase, Application[]>;
  loading: Record<Phase, boolean>;
  unseenStatus: StatusFilter;
  tentativeStatus: StatusFilter;
  processedStatus: StatusFilter;
  onUnseenStatusChange: (value: StatusFilter) => void;
  onTentativeStatusChange: (value: StatusFilter) => void;
  onProcessedStatusChange: (value: StatusFilter) => void;
  onUpdateStatus: (
    appId: string,
    nextStatus: Status,
    fromPhase: Phase,
    options?: {
      wasWaitlisted?: boolean;
      refreshPhase?: Phase;
      batchNumber?: number;
    }
  ) => void;
}

export default function ApplicationsGrid({
  appsByPhase,
  loading,
  onUnseenStatusChange,
  onProcessedStatusChange,
  onTentativeStatusChange,
  onUpdateStatus,
  processedStatus,
  tentativeStatus,
  unseenStatus,
}: ApplicationsGridProps) {
  return (
    <section className="space-y-3">
      <h2 className="pb-2 font-medium">applications</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {PHASES.map((phase) => {
          const apps = appsByPhase[phase.id];
          const isLoading = loading[phase.id];

          if (phase.id === 'tentative') {
            return (
              <PhaseColumn
                key={phase.id}
                phase={phase.id}
                label={phase.label}
                apps={apps}
                isLoading={isLoading}
                statusFilter={tentativeStatus}
                statusOptions={TENTATIVE_STATUSES}
                onStatusChange={onTentativeStatusChange}
                renderActions={(app) => (
                  <button
                    type="button"
                    className="border border-red-700 bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase text-red-800"
                    onClick={() =>
                      onUpdateStatus(
                        app._id,
                        app.wasWaitlisted ? 'waitlisted' : 'pending',
                        'tentative',
                        {
                          wasWaitlisted: app.wasWaitlisted,
                          refreshPhase: 'unseen',
                        }
                      )
                    }
                  >
                    undo selection
                  </button>
                )}
                footer={
                  <FinalizeButton
                    apps={apps}
                    onFinalizeStatus={onUpdateStatus}
                  />
                }
              />
            );
          }

          if (phase.id === 'processed') {
            return (
              <PhaseColumn
                key={phase.id}
                phase={phase.id}
                label={phase.label}
                apps={apps}
                isLoading={isLoading}
                statusFilter={processedStatus}
                statusOptions={PROCESSED_STATUSES}
                onStatusChange={onProcessedStatusChange}
                renderActions={() => null}
              />
            );
          }

          return (
            <PhaseColumn
              key={phase.id}
              phase={phase.id}
              label={phase.label}
              apps={apps}
              isLoading={isLoading}
              statusFilter={unseenStatus}
              statusOptions={UNSEEN_STATUSES}
              onStatusChange={onUnseenStatusChange}
              renderActions={(app) =>
                app.status === 'waitlisted' ? (
                  <>
                    <button
                      type="button"
                      className="border border-green-700 bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase text-green-800"
                      onClick={() =>
                        onUpdateStatus(
                          app._id,
                          'tentatively_waitlist_accepted',
                          'unseen',
                          {
                            refreshPhase: 'tentative',
                          }
                        )
                      }
                    >
                      accept
                    </button>
                    <button
                      type="button"
                      className="border-2 border-red-800 bg-red-200 px-3 py-2 text-[11px] font-bold uppercase text-red-900"
                      onClick={() =>
                        onUpdateStatus(
                          app._id,
                          'tentatively_waitlist_rejected',
                          'unseen',
                          {
                            refreshPhase: 'tentative',
                          }
                        )
                      }
                    >
                      FINAL REJECT
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="border border-green-700 bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase text-green-800"
                      onClick={() =>
                        onUpdateStatus(
                          app._id,
                          'tentatively_accepted',
                          'unseen',
                          {
                            refreshPhase: 'tentative',
                          }
                        )
                      }
                    >
                      accept
                    </button>
                    <button
                      type="button"
                      className="border border-yellow-700 bg-yellow-100 px-2 py-1 text-[10px] font-semibold uppercase text-yellow-800"
                      onClick={() =>
                        onUpdateStatus(
                          app._id,
                          'tentatively_waitlisted',
                          'unseen',
                          {
                            refreshPhase: 'tentative',
                          }
                        )
                      }
                    >
                      waitlist
                    </button>
                  </>
                )
              }
            />
          );
        })}
      </div>
    </section>
  );
}
