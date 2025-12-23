"use client";

import { Application, Phase, StatusFilter } from "../_types";
import { PHASES, PROCESSED_STATUSES, TENTATIVE_STATUSES } from "../_utils/constants";
import PhaseColumn from "./PhaseColumn";

interface ApplicationsGridProps {
  appsByPhase: Record<Phase, Application[]>;
  loading: Record<Phase, boolean>;
  tentativeStatus: StatusFilter;
  processedStatus: StatusFilter;
  onTentativeStatusChange: (value: StatusFilter) => void;
  onProcessedStatusChange: (value: StatusFilter) => void;
}

export default function ApplicationsGrid({
  appsByPhase,
  loading,
  onProcessedStatusChange,
  onTentativeStatusChange,
  processedStatus,
  tentativeStatus,
}: ApplicationsGridProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">applications</h2>

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
            />
          );
        })}
      </div>
    </section>
  );
}
