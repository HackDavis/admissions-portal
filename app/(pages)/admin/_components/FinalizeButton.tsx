'use client';

import { useState } from 'react';
import { Application } from '@/app/_types/application';
import { Status } from '@/app/_types/applicationFilters';
import { exportTitoCSV } from '@utils/exportTito';
import { prepareMailchimpInvites } from '@utils/prepareMailchimp';

interface FinalizeButtonProps {
  apps: Application[];
  onFinalizeStatus: (
    appId: string,
    nextStatus: Status,
    fromPhase: 'tentative',
    options?: { wasWaitlisted?: boolean; refreshPhase?: 'processed' }
  ) => void;
}

const FINAL_STATUS_MAP: Record<string, Status> = {
  tentatively_accepted: 'accepted',
  tentatively_rejected: 'rejected',
  tentatively_waitlisted: 'waitlisted',
};

export default function FinalizeButton({
  apps,
  onFinalizeStatus,
}: FinalizeButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFinalize = async () => {
    // Auto download CSV
    await downloadCSV('tentatively_accepted');
    alert('Applicants finalized and CSV downloaded for ACCEPTED applicants!');
  };

  async function downloadCSV(status: Status) {
    try {
      console.log(`Exporting ${status} applicants to CSV...\n`);

      const csv = await exportTitoCSV(status); // server action
      if (!csv || csv.trim() === '') {
        alert(`No ${status} applicants found to export.`);
        return;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const download = `tito_import_${new Date().toISOString()}.csv`;
      const a = document.createElement('a');
      a.href = url;
      a.download = download;
      a.click();
      URL.revokeObjectURL(url);

      setIsPopupOpen(true);
    } catch (err: any) {
      console.error(err);
      alert('Failed to export CSV: ' + (err.message ?? err));
    }
  }

  // Sends Mailchimp email && updates application status
  async function processMailchimpInvites() {
    setIsProcessing(true);
    const results: string[] = [];

    const batches = [
      { label: 'Acceptances', type: 'tentatively_accepted' },
      { label: 'Waitlist', type: 'tentatively_waitlisted' },
      { label: 'Rejections', type: 'tentatively_rejected' }
    ];

    // Sends Mailchimp invites
    try {
      for (const batch of batches) {
        const batchApps = apps.filter(a => a.status === batch.type);
        if (batchApps.length === 0) continue;

        const res = await prepareMailchimpInvites(batch.type as any);
        if (res.count > 0) {
          const successfulApps = batchApps.slice(0, res.count); // apps successfully processed in this batch

          //Update tentative statuses
          const updates = successfulApps.map((app) =>
            onFinalizeStatus(app._id, FINAL_STATUS_MAP[app.status], 'tentative', {
              wasWaitlisted: app.status === 'tentatively_waitlisted',
              refreshPhase: 'processed',
            })
          );
          await Promise.all(updates);
          results.push(`✅ ${batch.label}: ${res.count} processed`);
        }

        if (!res.ok) {
          const errorMsg = res.error ?? 'Unknown API Error';
          results.push(`❌ ${batch.label} HALTED: ${errorMsg}`);
          alert(results.join('\n'));
          return;
        }
      }

      alert(results.join('\n'));
    } catch (err: any) {
      console.error(err);
      alert(
        `Failed to send Mailchimp invites and/or update application statuses: ${
          err.message ?? err
        }`
      );
    } finally {
      setIsProcessing(false);
      setIsPopupOpen(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
        title="finalize tentative applicants"
        onClick={handleFinalize}
        disabled={apps.length === 0}
      >
        finalize
      </button>

      {/* Popup menu */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <h2 className="text-lg font-bold mb-4">Finalize Applicants</h2>

            <div className="mb-4 text-sm space-y-1">
              <p>Export complete!</p>
              <p>Next steps:</p>
              <p>
                1. Go to your{" "}
                <a
                  href="https://dashboard.tito.io/hackdavis/hackdavis-2026-test/rsvp_lists"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Tito RSVP Lists
                </a>
              </p>
              <p>2. Navigate to Actions → Manage Invitations</p>
              <p>3. Click the "Import" button</p>
              <p>4. Upload the downloaded CSV file</p>
              <p>5. Tito will create all the invitations!</p>
              <p>
                After import, click the button below to send out Mailchimp
                invites!
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={processMailchimpInvites}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Mailchimp Invite'}
              </button>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
                disabled={isProcessing}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
