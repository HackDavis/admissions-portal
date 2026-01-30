'use client';

import { useState } from 'react';

import { Application } from '@/app/_types/application';
import { Phase, Status, StatusFilter } from '@/app/_types/applicationFilters';
import { prettyStatus } from '../_utils/format';
import ApplicantDetailsModal from './ApplicantDetailsModal';

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
  phase: _,
  apps,
  isLoading,
  label,
  onStatusChange,
  statusFilter,
  statusOptions,
  footer,
  renderActions,
}: PhaseColumnProps) {
  const [selectedApplicant, setSelectedApplicant] =
    useState<Application | null>(null);

  return (
    <div className="border-2 border-black p-3 flex h-screen flex-col">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase">{label}</h3>
          <p className="text-xs">
            {isLoading
              ? 'loading...'
              : `${apps.length} applicant${apps.length === 1 ? '' : 's'}`}
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
          apps.map((app) => (
            <div
              key={app._id}
              className="border-2 border-black p-2 flex flex-col gap-1"
            >
              <p className="text-xs">id: {app._id}</p>
              <p className="text-xs">
                name: {app.firstName ?? '-'} {app.lastName ?? ''}
              </p>
              <p className="text-xs">email: {app.email}</p>
              <p className="text-xs">
                ucd: {app.isUCDavisStudent ? 'yes' : 'no'}
              </p>
              <p className="text-xs">school: {app.university ?? '-'}</p>
              <p className="text-xs">major: {app.major ?? '-'}</p>
              <p className="text-xs">year: {app.year ?? '-'}</p>
              <p
                className={`text-xs ${
                  !app.isOver18 ? 'font-bold text-red-600' : ''
                }`}
              >
                is over 18: {app.isOver18 ? 'yes' : 'no'}
              </p>
              <p className="text-xs">
                status:{' '}
                <span className="font-medium">{prettyStatus(app.status)}</span>
              </p>
              <p
                className={`text-xs ${
                  app.wasWaitlisted ? 'font-bold text-red-600' : ''
                }`}
              >
                was waitlisted: {app.wasWaitlisted ? 'yes' : 'no'}
              </p>
              {renderActions && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {renderActions(app)}
                </div>
              )}
              <button
                type="button"
                className="mt-1 border border-black px-2 py-1 text-[10px] uppercase"
                onClick={() => setSelectedApplicant(app)}
              >
                view all details
              </button>
            </div>
          ))
        )}
      </div>

      {footer && <div className="mt-3 flex justify-center">{footer}</div>}

      {selectedApplicant && (
        <ApplicantDetailsModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}
    </div>
  );
}
