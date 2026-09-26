import { useEffect, useState } from 'react';
import { Application } from '@/app/_types/application';

export default function useApplicantSelection(
  apps: Application[],
  isLoading: boolean,
  statusFilter: string
) {
  const [selection, setSelection] = useState<Application[]>([]);

  useEffect(() => {
    setSelection([]);
  }, [isLoading, statusFilter]);

  useEffect(() => {
    setSelection((current) =>
      apps.filter((app) =>
        current.some(
          (selected) =>
            selected._id === app._id && selected.status === app.status
        )
      )
    );
  }, [apps]);

  // Use current records immediately, before effects reconcile stored selection.
  const selectedApplicants = isLoading
    ? []
    : apps.filter((app) =>
        selection.some(
          (selected) =>
            selected._id === app._id && selected.status === app.status
        )
      );

  return [selectedApplicants, setSelection] as const;
}
