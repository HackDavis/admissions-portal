"use client";

import { useState } from "react";

import { Application, Phase, Status, StatusFilter } from "../_types";
import { prettyStatus } from "../_utils/format";
import ApplicantDetailsModal from "./ApplicantDetailsModal";

interface PhaseColumnProps {
  phase: Phase;
  label: string;
  apps: Application[];
  isLoading: boolean;
  statusFilter?: StatusFilter;
  statusOptions?: Status[];
  onStatusChange?: (value: StatusFilter) => void;
  footer?: React.ReactNode;
  renderActions?: (app: Application) => React.ReactNode;
}

export default function PhaseColumn({
  apps,
  isLoading,
  label,
  onStatusChange,
  phase,
  statusFilter,
  statusOptions,
  footer,
  renderActions,
}: PhaseColumnProps) {
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(
    null
  );

  return (
    <div className="border-2 border-black p-3 flex h-screen flex-col">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase">{label}</h3>
          <p className="text-xs">
            {isLoading
              ? "loading..."
              : `${apps.length} applicant${apps.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {statusOptions && statusFilter && onStatusChange && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase">status</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
              className="border-2 border-black px-2 py-1 text-xs"
            >
              <option value="all">all</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {prettyStatus(s)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {!isLoading && apps.length === 0 ? (
          <p className="text-xs">no applicants here yet...</p>
        ) : (
          apps.map((a) => (
            <div key={a.id} className="border-2 border-black p-2 flex flex-col gap-1">
              <p className="text-xs">id: {a.id}</p>
              <p className="text-xs">name: {a.firstName ?? "-"} {a.lastName ?? ""}</p>
              <p className="text-xs">email: {a.email}</p>
              <p className="text-xs">ucd: {a.isUCDavisStudent ? "yes" : "no"}</p>
              <p className="text-xs">school: {a.university ?? "-"}</p>
              <p className="text-xs">major: {a.major ?? "-"}</p>
              <p className="text-xs">year: {a.year ?? "-"}</p>
              <p className="text-xs">
                status: <span className="font-medium">{prettyStatus(a.status)}</span>
              </p>
              <p
                className={`text-xs ${
                  a.wasWaitlisted ? "font-bold text-red-600" : ""
                }`}
              >
                was waitlisted: {a.wasWaitlisted ? "yes" : "no"}
              </p>
              {renderActions && (
                <div className="mt-1 flex flex-wrap gap-2">{renderActions(a)}</div>
              )}
              <button
                type="button"
                className="mt-1 border border-black px-2 py-1 text-[10px] uppercase"
                onClick={() => setSelectedApplicant(a)}
              >
                view all details
              </button>
            </div>
          ))
        )}
      </div>

      {footer && <div className="mt-3">{footer}</div>}

      {selectedApplicant && (
        <ApplicantDetailsModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}
    </div>
  );
}
