import { Dispatch, SetStateAction } from 'react';
import { Phase, Status } from '@/app/_types/applicationFilters';
import {
  Application,
  ApplicationStatusUpdateResult,
} from '@/app/_types/application';
import { useState, useEffect, useRef } from 'react';
import BulkModal from './BulkModal';

interface SelectAllButtonProps {
  selectedApplicants: Application[];
  apps: Application[];
  setSelectedApplicants: Dispatch<SetStateAction<Application[]>>;
}

export function SelectAllButton({
  selectedApplicants,
  apps,
  setSelectedApplicants,
}: SelectAllButtonProps) {
  const selectedIds = new Set(selectedApplicants.map((app) => app._id));
  const allSelected =
    apps.length > 0 && apps.every((app) => selectedIds.has(app._id));
  const selectAllApplicants = () => {
    if (allSelected) {
      setSelectedApplicants([]);
    } else {
      setSelectedApplicants(apps);
    }
  };

  return (
    <button
      type="button"
      className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
      title="select all applications"
      onClick={selectAllApplicants}
      disabled={apps.length < 1}
    >
      {apps.length < 1
        ? 'nothing to select'
        : allSelected
        ? 'deselect all'
        : 'select all'}
    </button>
  );
}

interface ActionButtonProps {
  selectedApplicants: Application[];
  setSelectedApplicants?: Dispatch<SetStateAction<Application[]>>;
  onUpdateStatus: (
    appId: string,
    nextStatus: Status,
    fromPhase: Phase,
    options?: {
      wasWaitlisted?: boolean;
      refreshPhase?: Phase;
      batchNumber?: number;
    }
  ) => Promise<ApplicationStatusUpdateResult>;
}

type BulkAction = 'accept' | 'waitlist' | 'undo';

function BulkActionButton({
  selectedApplicants,
  setSelectedApplicants,
  onUpdateStatus,
  action,
}: ActionButtonProps & { action: BulkAction }) {
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processing = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState<Application[]>([]);
  const [failures, setFailures] = useState<
    { applicant: Application; error: string }[]
  >([]);

  useEffect(() => {
    if (!confirmed) return;
    const timeout = setTimeout(() => setConfirmed(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirmed]);

  const runAction = async () => {
    if (processing.current || selectedApplicants.length === 0) return;
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    processing.current = true;
    setConfirmed(false);
    setIsProcessing(true);
    setResults([]);
    setFailures([]);
    setShowModal(true);
    const applicants = [...selectedApplicants];
    try {
      const outcomes = await Promise.all(
        applicants.map(async (applicant) => {
          try {
            const nextStatus =
              action === 'undo'
                ? applicant.wasWaitlisted
                  ? 'waitlisted'
                  : 'pending'
                : action === 'waitlist'
                ? 'tentatively_waitlisted'
                : applicant.status === 'waitlisted'
                ? 'tentatively_waitlist_accepted'
                : 'tentatively_accepted';
            const result = await onUpdateStatus(
              applicant._id,
              nextStatus,
              action === 'undo' ? 'tentative' : 'unseen',
              action === 'undo'
                ? {
                    wasWaitlisted: applicant.wasWaitlisted,
                    refreshPhase: 'unseen',
                  }
                : { refreshPhase: 'tentative' }
            );
            return { applicant, result };
          } catch (error) {
            return {
              applicant,
              result: {
                ok: false as const,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Failed to update applicant',
              },
            };
          }
        })
      );
      const succeeded = outcomes
        .filter(({ result }) => result.ok)
        .map(({ applicant }) => applicant);
      setResults(succeeded);
      setFailures(
        outcomes.flatMap(({ applicant, result }) =>
          result.ok ? [] : [{ applicant, error: result.error }]
        )
      );
      const succeededIds = new Set(succeeded.map((applicant) => applicant._id));
      setSelectedApplicants?.((current) =>
        current.filter((applicant) => !succeededIds.has(applicant._id))
      );
    } finally {
      processing.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className={`special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase ${
          confirmed ? 'bg-black text-white' : ''
        }`}
        onClick={runAction}
        disabled={isProcessing || selectedApplicants.length < 1}
      >
        {isProcessing
          ? 'processing...'
          : confirmed
          ? 'u sure?'
          : selectedApplicants.length < 1
          ? `nothing to ${action}`
          : `${action} selected`}
      </button>
      <BulkModal
        isOpen={showModal}
        isProcessing={isProcessing}
        action={action}
        results={results}
        failures={failures}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export function TentativelyAcceptedSelectedButton(props: ActionButtonProps) {
  return <BulkActionButton {...props} action="accept" />;
}

export function TentativelyWaitlistedSelectedButton(props: ActionButtonProps) {
  return <BulkActionButton {...props} action="waitlist" />;
}

export function UndoSelectedButton(props: ActionButtonProps) {
  return <BulkActionButton {...props} action="undo" />;
}
