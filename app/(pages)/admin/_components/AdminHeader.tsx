'use client';

import { useMailchimp } from '../_hooks/useMailchimp';
import { prepareMailchimpInvites } from '@utils/prepareMailchimp';
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

  async function processRsvpReminders() {
    setIsProcessing(true);
    try {
      const res = await prepareMailchimpInvites('rsvp_reminder');
      if (!res.ok) {
        alert(`Error processing RSVP reminders: ${res.error}`);
      }

      const processedCount = res.ids?.length ?? 0;
      if (processedCount > 0) {
        alert(`Successfully processed ${processedCount} RSVP reminders!`);
      } else {
        alert('No RSVP reminders to process.');
      }
    } catch (err: any) {
      console.error('Error processing RSVP reminders:', err);
      alert(`Error processing RSVP reminders: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }

  const { mailchimp } = useMailchimp();
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
    <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
        onClick={processRsvpReminders}
        className="special-button px-2 py-1 text-xs"
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'send rsvp reminders'}
      </button>

      <div>
        <p className="mt-1 text-xs font-semibold">Mailchimp API status</p>
        <p className="mt-1 text-xs">Batch: {mc.batchNumber}</p>
        <p className="mt-1 text-xs">
          Calls: {mc.apiCallsMade}/{mc.maxApiCalls} (key #{mc.apiKeyIndex}/
          {mc.maxApiKeys})
        </p>
        <p className="mt-1 text-xs">Last update: {mc.lastUpdate.toString()}</p>
        <p className="mt-1 text-xs">Last reset: {mc.lastReset.toString()}</p>
      </div>
    </header>
  );
}
