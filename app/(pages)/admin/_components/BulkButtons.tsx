import { Dispatch, SetStateAction } from 'react';
import { Phase, Status } from '@/app/_types/applicationFilters';
import { Application } from '@/app/_types/application';
import { useState, useEffect } from 'react';
import BulkModal from './BulkModal';

interface SelectAllButtonProps {
  selectedApplicantsCount: number;
  apps: Application[];
  setSelectedApplicants: Dispatch<SetStateAction<Application[]>>;
}

export function SelectAllButton({
  selectedApplicantsCount,
  apps,
  setSelectedApplicants,
}: SelectAllButtonProps) {
  const selectAllApplicants = () => {
    if (selectedApplicantsCount === apps.length) {
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
        : selectedApplicantsCount === apps.length
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
  ) => void;
}

export function TentativelyAcceptedSelectedButton({
  selectedApplicants,
  setSelectedApplicants,
  onUpdateStatus,
}: ActionButtonProps) {
  const [count, setCount] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saveSelected, setSaveSelected] = useState<Application[]>([]);

  const tentativelyAcceptedSelectedApplicants = () => {
    if (count > 0) {
      for (const applicant of selectedApplicants) {
        onUpdateStatus(applicant._id, 'tentatively_accepted', 'unseen', {
          refreshPhase: 'tentative',
        });
      }
      setSaveSelected(selectedApplicants);
      setSelectedApplicants?.([]);
      setShowModal(true);
    } else {
      setCount(1);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCount(0);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [count]);

  return (
    <div>
      <button
        type="button"
        className={`special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase ${
          count > 0 ? 'bg-black text-white' : ''
        }`}
        title="tentatively accept selected applications"
        onClick={tentativelyAcceptedSelectedApplicants}
        disabled={selectedApplicants.length < 1}
      >
        {count > 0
          ? 'u sure?'
          : selectedApplicants.length < 1
          ? 'nothing to accept'
          : 'accept selected'}
      </button>
      <BulkModal
        isOpen={showModal}
        action="accept"
        results={saveSelected}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export function TentativelyWaitlistedSelectedButton({
  selectedApplicants,
  setSelectedApplicants,
  onUpdateStatus,
}: ActionButtonProps) {
  const [count, setCount] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saveSelected, setSaveSelected] = useState<Application[]>([]);

  const tentativelyWaitlistedSelectedApplicants = () => {
    if (count > 0) {
      for (const applicant of selectedApplicants) {
        onUpdateStatus(applicant._id, 'tentatively_waitlisted', 'unseen', {
          refreshPhase: 'tentative',
        });
      }
      setSaveSelected(selectedApplicants);
      setSelectedApplicants?.([]);
      setShowModal(true);
    } else {
      setCount(1);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCount(0);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [count]);

  return (
    <div>
      <button
        type="button"
        className={`special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase ${
          count > 0 ? 'bg-black text-white' : ''
        }`}
        title="tentatively waitlist selected applications"
        onClick={tentativelyWaitlistedSelectedApplicants}
        disabled={selectedApplicants.length < 1}
      >
        {count > 0
          ? 'u sure?'
          : selectedApplicants.length < 1
          ? 'nothing to waitlist'
          : 'waitlist selected'}
      </button>
      <BulkModal
        isOpen={showModal}
        action="waitlist"
        results={saveSelected}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export function UndoSelectedButton({
  selectedApplicants,
  setSelectedApplicants,
  onUpdateStatus,
}: ActionButtonProps) {
  const [count, setCount] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saveSelected, setSaveSelected] = useState<Application[]>([]);

  const undoSelected = () => {
    if (count > 0) {
      for (const applicant of selectedApplicants) {
        onUpdateStatus(
          applicant._id,
          applicant.wasWaitlisted ? 'waitlisted' : 'pending',
          'tentative',
          { wasWaitlisted: applicant.wasWaitlisted, refreshPhase: 'unseen' }
        );
      }
      setSaveSelected(selectedApplicants);
      setSelectedApplicants?.([]);
      setShowModal(true);
    } else {
      setCount(1);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCount(0);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [count]);

  return (
    <div>
      <button
        type="button"
        className={`special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase ${
          count > 0 ? 'bg-black text-white' : ''
        }`}
        title="undo selected applications"
        onClick={undoSelected}
        disabled={selectedApplicants.length < 1}
      >
        {count > 0
          ? 'u sure?'
          : selectedApplicants.length < 1
          ? 'nothing to undo'
          : 'undo selected'}
      </button>
      <BulkModal
        isOpen={showModal}
        action="undo"
        results={saveSelected}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
