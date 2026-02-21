'use client';

import { useMailchimp } from '../_hooks/useMailchimp';
import { processRsvpReminders } from '../_utils/processRsvpReminders';
import { useState } from 'react';

interface AdminHeaderProps {
  totalCount: number;
  onLogout: () => void;
}

export default function AdminHeader({
  totalCount,
  onLogout,
}: AdminHeaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  async function handleProcessRsvpReminders() {
    setIsProcessing(true);
    try {
      await processRsvpReminders();
      await refreshMailchimp();
    } catch (err: any) {
      console.error('Error while processing RSVP reminders:', err);
      alert('Error processing RSVP reminders:' + err.message);
    } finally {
      setIsProcessing(false);
      setIsPopupOpen(false);
    }
  }

  const { mailchimp, refresh: refreshMailchimp } = useMailchimp();
  const mc = mailchimp ?? {
    batchNumber: 'N/A',
    apiCallsMade: 0,
    maxApiCalls: 0,
    apiKeyIndex: 0,
    maxApiKeys: 0,
    lastUpdate: 'N/A',
    lastReset: 'N/A',
  };
  return (
    <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-xl font-semibold">hackdavis admissions admin</h1>
        <button onClick={onLogout} className="special-button px-2 py-1 text-xs">
          Logout
        </button>
        <p className="mt-1 text-xs">
          loaded: {totalCount} applications (filtered server-side)
        </p>
      </div>

      <button
        onClick={setIsPopupOpen.bind(null, true)}
        className="special-button px-2 py-1 text-xs"
        disabled={isProcessing}
      >
        process rsvp reminders
      </button>

      <div>
        <p className="mt-1 text-xs">-- Batch: {mc.batchNumber} --</p>
        <p className="mt-1 text-xs font-semibold">Mailchimp API status</p>
        <p className="mt-1 text-xs">
          Sent: {mc.apiCallsMade}/{mc.maxApiCalls} (key #{mc.apiKeyIndex}/
          {mc.maxApiKeys})
        </p>
        <button
          onClick={() => setShowMore(!showMore)}
          className="mt-1 text-xs underline text-gray-500 hover:text-black"
        >
          {showMore ? 'show less' : 'show more...'}
        </button>
        {showMore && (
          <>
            <p className="mt-1 text-xs">
              Last update:{' '}
              {mc.lastUpdate !== 'N/A'
                ? new Date(mc.lastUpdate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'America/Los_Angeles',
                  }) + ' PST'
                : 'N/A'}
            </p>
            <p className="mt-1 text-xs">
              Last reset:{' '}
              {mc.lastReset !== 'N/A'
                ? new Date(mc.lastReset).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'America/Los_Angeles',
                  }) + ' PST'
                : 'N/A'}
            </p>
          </>
        )}
      </div>

      {/* Popup menu */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="border-2 border-black bg-white shadow-xl max-w-lg w-full p-6 relative">
            <h2 className="text-lg font-bold mb-4">process rsvp reminders</h2>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleProcessRsvpReminders}
                className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'CONFIRM (yes)'}
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
    </header>
  );
}
