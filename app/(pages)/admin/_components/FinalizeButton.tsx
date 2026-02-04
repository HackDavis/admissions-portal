'use client';

import { useState } from 'react';
import { Application } from '@/app/_types/application';
import { Status } from '@/app/_types/applicationFilters';
import { generateTitoCSV } from '@utils/generateTitoCSV';
import { prepareMailchimpInvites } from '@utils/prepareMailchimp';
import { useMailchimp } from '../_hooks/useMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';

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

const FINAL_STATUS_MAP: Record<string, Status> = {
  tentatively_accepted: 'accepted',
  tentatively_waitlisted: 'waitlisted',
  tentatively_waitlist_accepted: 'waitlist_accepted',
  tentatively_waitlist_rejected: 'waitlist_rejected',
};

const WAITLIST_STATUSES = [
  'tentatively_waitlisted',
  'tentatively_waitlist_accepted',
  'tentatively_waitlist_rejected',
];

export default function FinalizeButton({
  apps,
  onFinalizeStatus,
}: FinalizeButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mailchimp, refresh: refreshMailchimp } = useMailchimp();

  const currentBatch = mailchimp?.batchNumber ?? -1;

  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      // Auto download CSV for (tentatively) accepted & waitlist-accepted applicants
      const statuses: Status[] = [
        'tentatively_accepted',
        'tentatively_waitlist_accepted',
      ];
      await downloadCSV(statuses);
      alert('CSV downloaded for all ACCEPTED applicants!');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to download CSV: ${err.message ?? err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  async function downloadCSV(statuses: Status[]) {
    try {
      console.log(`Exporting ${statuses} applicants to CSV...\n`);

      const csv = await generateTitoCSV(statuses); // server action
      if (!csv || csv.trim() === '') {
        alert(`No ${statuses} applicants found to export.`);
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

  // Prepares Mailchimp invites && updates application status
  async function processAllApplicants() {
    setIsProcessing(true);
    const results: string[] = [];
    let hadError = false;

    const batches = [
      { label: 'Acceptances', types: ['tentatively_accepted'] as const },
      { label: 'Waitlists', types: ['tentatively_waitlisted'] as const },
      {
        label: 'Waitlist Acceptances',
        types: ['tentatively_waitlist_accepted'] as const,
      },
      {
        label: 'Waitlist Rejections',
        types: ['tentatively_waitlist_rejected'] as const,
      },
    ] as const;

    // Prepares Mailchimp invites
    try {
      for (const batch of batches) {
        const res = await prepareMailchimpInvites(batch.types[0]);
        const processedCount = res.ids?.length ?? 0;

        // We have to update application statuses here to account for partial-success
        if (processedCount > 0) {
          const successfulApps = apps.filter((app) =>
            res.ids.includes(app._id)
          );
          await Promise.all(
            successfulApps.map((app) =>
              onFinalizeStatus(
                app._id,
                FINAL_STATUS_MAP[app.status],
                'tentative',
                {
                  wasWaitlisted: WAITLIST_STATUSES.includes(app.status),
                  refreshPhase:
                    app.status === 'tentatively_waitlisted'
                      ? 'unseen'
                      : 'processed',
                  batchNumber: currentBatch,
                }
              )
            )
          );
        }

        const statusEmoji = res.ok && !res.error ? '✅' : '❌';
        let batchMessage = `${statusEmoji} ${batch.label}: ${processedCount} processed`;

        if (res.error) {
          // Partial & full failure
          batchMessage += `\n${res.error}`;
          hadError = true;
        }
        results.push(batchMessage);

        if (!res.ok) {
          // Full failure (server misconfig, network, etc)
          break;
        }
      }

      // increment batchNumber
      if (!hadError) {
        try {
          await updateMailchimp({ batchNumber: 1, lastUpdate: new Date() }); // increment batch number by 1
        } catch (err) {
          console.error('Failed to increment Mailchimp batch number: ', err);
        }
      }
      await refreshMailchimp();

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
        disabled={isProcessing || apps.length === 0 || apps.length > 110}
      >
        {apps.length > 110 ? 'batch size limit: 110' : 'finalize'}
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
                1. Go to your{' '}
                <a
                  href={process.env.TITO_DASHBOARD_URL}
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
                After import, click the button below to export to Mailchimp!
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={processAllApplicants}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Process Applicants'}
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
