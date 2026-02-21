'use client';

import { Application } from '@/app/_types/application';
import { Status } from '@/app/_types/applicationFilters';
import { TitoConfigModal } from './TitoConfigModal';
import { FinalizeResultsModal } from './FinalizeResultsModal';
import { useFinalizeApps } from '../_hooks/useFinalizeApps';

interface FinalizeButtonProps {
  apps: Application[];
  onFinalizeStatus: (
    appId: string,
    nextStatus: Status,
    fromPhase: 'tentative',
    options?: {
      wasWaitlisted?: boolean;
      refreshPhase?: 'processed' | 'unseen';
      batchNumber?: number;
    }
  ) => void;
}

export default function FinalizeButton({
  apps,
  onFinalizeStatus,
}: FinalizeButtonProps) {
  const { state, actions } = useFinalizeApps(apps, onFinalizeStatus);

  return (
    <div>
      <button
        type="button"
        className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
        title="finalize tentative applicants"
        onClick={actions.handleFinalize}
        disabled={state.isProcessing || apps.length === 0 || apps.length > 110}
      >
        {apps.length > 110 ? 'batch size limit: 110' : 'finalize'}
      </button>

      {/* Tito Configuration & Processing Modal */}
      <TitoConfigModal
        isOpen={state.showTitoModal}
        isProcessing={state.isProcessing}
        loadingTitoData={state.loadingTitoData}
        rsvpLists={state.rsvpLists}
        releases={state.releases}
        selectedRsvpList={state.selectedRsvpList}
        selectedReleases={state.selectedReleases}
        onSelectRsvpList={actions.setSelectedRsvpList}
        onToggleRelease={actions.toggleRelease}
        onCancel={() => actions.setShowTitoModal(false)}
        onConfirm={actions.handleProcessAll}
      />

      {/* Results Modal */}
      <FinalizeResultsModal
        isOpen={state.showResultsModal}
        results={state.processingResults}
        onClose={() => {
          actions.setShowResultsModal(false);
          actions.setProcessingResults(null);
        }}
      />
    </div>
  );
}
