'use client';

import { useState } from 'react';
import { exportAcceptedApplicants } from '../_utils/exportAcceptedApplicants';

type ExportState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success', count: number }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

export function ExportAcceptedButton() {
  const [state, setState] = useState<ExportState>({ kind: 'idle' });

  async function handleExport() {
    setState({ kind: 'loading' });
    try {
      const count = await exportAcceptedApplicants();
      setState(count === 0 ? { kind: 'empty' } : { kind: 'success', count });
    } catch (err: any) {
      console.error('Error exporting accepted applicants:', err);
      setState({
        kind: 'error',
        message: err?.message ?? 'Export failed.'
      })
    }
  }

  const disabled = state.kind === 'loading' || state.kind === 'empty';

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleExport}
        disabled={disabled}
        className="special-button px-2 py-1 text-xs disabeled:opacity-50 disabled"
      >
        {state.kind === 'loading' ? 'exporting...' : 'export accepted (csv)'}
      </button>

      {state.kind === 'success' && (
        <p className="text-[11px]">{state.count} applicants exported</p>
      )}
      {state.kind === 'empty' && (
        <p className="text-[11px]">
          There are no accepted applicants to export.
        </p>
      )}
      {state.kind === 'error' && (
        <p className="text-[11px] text-red-500">
          {state.message}
        </p>
      )}
    </div>
  );
}