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

    //TODO: maybe no need to download all 3 if no apps in that status
    await downloadCSV('tentatively_accepted');
    await downloadCSV('tentatively_waitlisted');
    await downloadCSV('tentatively_rejected');
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
      const download = `tito_import_${status}${new Date().toISOString()}.csv`;
      const a = document.createElement('a');
      a.href = url;
      a.download = download;
      a.click();
      URL.revokeObjectURL(url);

      alert('Applicants finalized and CSV downloaded!');
      setIsPopupOpen(true);
    } catch (err: any) {
      console.error(err);
      alert('Failed to export CSV: ' + (err.message ?? err));
    }
  }

  // Sends Mailchimp email && updates application status
  async function processMailchimpInvites() {
    setIsProcessing(true);
    // Sends Mailchimp invites
    try {
      //TODO: maybe no need to send alert if no apps in that status
      const acceptRes = await prepareMailchimpInvites('tentatively_accepted');
      if (!acceptRes.ok) {
        alert(`Error in Acceptances: ${acceptRes.error}`);
        return;
      }
      alert(`Success: ${acceptRes.count} Acceptance emails processed.`);

      const waitlistRes = await prepareMailchimpInvites(
        'tentatively_waitlisted'
      );
      if (!waitlistRes.ok) {
        alert(`Error in Waitlist: ${waitlistRes.error}`);
        return;
      }
      alert(`Success: ${waitlistRes.count} Waitlist emails processed.`);

      const rejectRes = await prepareMailchimpInvites('tentatively_rejected');
      if (!rejectRes.ok) {
        alert(`Error in Rejections: ${rejectRes.error}`);
        return;
      }
      alert(`Success: ${rejectRes.count} Rejection emails processed.`);

      alert('All batches completed successfully!');
      setIsPopupOpen(false);

      //Update tentative statuses
      const updates = apps
        .filter((app) => app.status in FINAL_STATUS_MAP)
        .map((app) =>
          onFinalizeStatus(app._id, FINAL_STATUS_MAP[app.status], 'tentative', {
            wasWaitlisted: app.status === 'tentatively_waitlisted',
            refreshPhase: 'processed',
          })
        );
      await Promise.all(updates);
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
              <p>1. Go to your Tito RSVP Lists</p>
              <p>2. Navigate to Actions → Manage Invitations</p>
              <p>3. Click the "Import" button</p>
              <p>4. Upload the CSV file after downloading</p>
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
