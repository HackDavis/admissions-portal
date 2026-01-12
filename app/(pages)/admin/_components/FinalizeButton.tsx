'use client';

import { useState } from 'react';
import { Application } from '@/app/_types/application';
import { Status } from '@/app/_types/applicationFilters';
import { exportTitoCSV } from '@actions/exportTito';

// TODO: Add Mailchimp + HackerHub invite flow here.

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

  const handleFinalize = async () => {
    const updates = apps
      .filter((app) => app.status in FINAL_STATUS_MAP)
      .map((app) =>
        onFinalizeStatus(app._id, FINAL_STATUS_MAP[app.status], 'tentative', {
          wasWaitlisted: app.status === 'tentatively_waitlisted',
          refreshPhase: 'processed',
        })
      );

    await Promise.all(updates);
    await downloadCSV();
  };

  async function downloadCSV() {
    try {
      console.log('Exporting tentatively accepted applicants to CSV...\n');
      const csv = await exportTitoCSV(); // server action
      if (!csv || csv.trim() === '') {
        alert('No tentatively accepted applicants found to export.');
        return;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const download = `tito_import_${new Date().toISOString().split('T')[0]}.csv`;
      const a = document.createElement('a');
      a.href = url;
      a.download = download;
      a.click();
      URL.revokeObjectURL(url);

      console.log('\nExport complete!');
      console.log('\nNext steps:');
      console.log('   1. Go to your Tito RSVP Lists');
      console.log('   2. Navigate to Actions → Manage Invitations');
      console.log("   3. Click the 'Import' button");
      console.log(`   4. Upload the file: ${a.download}`);
      console.log('   5. Tito will create all the invitations!');
      console.log(
        '\nAfter import, you can use the prepareMailChimp.ts to fetch the invitation URLs and send them via Mailchimp.'
      );

      alert('Applicants finalized and CSV downloaded!');
      setIsPopupOpen(true);
    } catch (err: any) {
      console.error(err);
      alert('Failed to export CSV: ' + (err.message ?? err));
    }
  };

  const handleMailchimp = () => {
    alert('Mailchimp coming soon');
    setIsPopupOpen(false);
    //TODO: implement mailchimp flow
  };

  return (
    <div className="relative inline-block">
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
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
          <button
            onClick={handleMailchimp}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Mailchimp Invite
          </button>
          <button
            onClick={() => setIsPopupOpen(false)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
    
  );
}
