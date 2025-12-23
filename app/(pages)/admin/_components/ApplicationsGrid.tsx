"use client";

import { Application, Phase, Status, StatusFilter } from "../_types";
import { PHASES, PROCESSED_STATUSES, TENTATIVE_STATUSES } from "../_utils/constants";
import FinalizeButton from "./FinalizeButton";
import PhaseColumn from "./PhaseColumn";

interface ApplicationsGridProps {
  appsByPhase: Record<Phase, Application[]>;
  loading: Record<Phase, boolean>;
  tentativeStatus: StatusFilter;
  processedStatus: StatusFilter;
  onTentativeStatusChange: (value: StatusFilter) => void;
  onProcessedStatusChange: (value: StatusFilter) => void;
  onUpdateStatus: (
    appId: string,
    nextStatus: Status,
    fromPhase: Phase,
    options?: { wasWaitlisted?: boolean }
  ) => void;
}

export default function ApplicationsGrid({
  appsByPhase,
  loading,
  onProcessedStatusChange,
  onTentativeStatusChange,
  onUpdateStatus,
  processedStatus,
  tentativeStatus,
}: ApplicationsGridProps) {
  return (
    <section className="space-y-3">
      <h2 className="pb-2 font-medium">applications</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {PHASES.map((phase) => {
          const apps = appsByPhase[phase.id];
          const isLoading = loading[phase.id];

          if (phase.id === "tentative") {
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
                    onClick={() => onUpdateStatus(app.id, "pending", "tentative")}
                  >
                    undo selection
                  </button>
                )}
                footer={<FinalizeButton apps={apps} onFinalizeStatus={onUpdateStatus} />}
              />
            );
          }

          if (phase.id === "processed") {
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
                renderActions={(app) =>
                  app.status === "waitlisted" ? (
                    <>
                      <button
                        type="button"
                        className="border border-green-700 bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase text-green-800"
                        onClick={() =>
                          onUpdateStatus(app.id, "tentatively_accepted", "processed")
                        }
                      >
                        waitlist accept
                      </button>
                      <button
                        type="button"
                        className="border border-red-700 bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase text-red-800"
                        onClick={() =>
                          onUpdateStatus(app.id, "tentatively_rejected", "processed")
                        }
                      >
                        waitlist reject
                      </button>
                    </>
                  ) : null
                }
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
              renderActions={(app) => (
                <>
                  <button
                    type="button"
                    className="border border-green-700 bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase text-green-800"
                    onClick={() =>
                      onUpdateStatus(app.id, "tentatively_accepted", "unseen")
                    }
                  >
                    accept
                  </button>
                  <button
                    type="button"
                    className="border border-red-700 bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase text-red-800"
                    onClick={() =>
                      onUpdateStatus(app.id, "tentatively_rejected", "unseen")
                    }
                  >
                    reject
                  </button>
                  <button
                    type="button"
                    className="border border-yellow-700 bg-yellow-100 px-2 py-1 text-[10px] font-semibold uppercase text-yellow-800"
                    onClick={() =>
                      onUpdateStatus(app.id, "tentatively_waitlisted", "unseen")
                    }
                  >
                    waitlist
                  </button>
                </>
              )}
            />
          );
        })}
      </div>
    </section>
  );
}
