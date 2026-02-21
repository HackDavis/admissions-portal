'use client';

import { useMailchimp } from '../_hooks/useMailchimp';
import { processRsvpReminders } from '../_utils/processRsvpReminders';
import { useState } from 'react';
import { TitoRsvpModal } from '../_components/TitoRsvpModal';
import { MailchimpApiStatusModal } from './MailchimpApiStatusModal';

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
  const { refresh: refreshMailchimp } = useMailchimp();

  async function handleProcessRsvpReminders(slug: string) {
    setIsProcessing(true);
    try {
      await processRsvpReminders(slug);
      await refreshMailchimp();
    } catch (err: any) {
      console.error('Error while processing RSVP reminders:', err);
      alert('Error processing RSVP reminders:' + err.message);
    } finally {
      setIsProcessing(false);
      setIsPopupOpen(false);
    }
  }

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

      <MailchimpApiStatusModal />

      <TitoRsvpModal
        isOpen={isPopupOpen}
        isProcessing={isProcessing}
        onClose={() => setIsPopupOpen(false)}
        onConfirm={handleProcessRsvpReminders}
      />
    </header>
  );
}
