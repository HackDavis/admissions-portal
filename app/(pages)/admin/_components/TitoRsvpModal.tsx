'use client';

import { useState, useEffect } from 'react';
import { RsvpList } from '@app/_types/tito';
import getRsvpLists from '@utils/tito/getRsvpLists';
import { useMailchimp } from '../_hooks/useMailchimp';
import { processRsvpReminders } from '../_utils/processRsvpReminders';

interface TitoRsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TitoRsvpModal({ isOpen, onClose }: TitoRsvpModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { refresh: refreshMailchimp } = useMailchimp();
  const [rsvpLists, setRsvpLists] = useState<RsvpList[]>([]);
  const [selectedRsvpSlug, setSelectedRsvpSlug] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcessRsvpReminders(slug: string) {
    setIsProcessing(true);
    try {
      await processRsvpReminders(slug);
      await refreshMailchimp();
    } catch (err: any) {
      console.error('Error while processing RSVP reminders: ', err);
      alert('Error processing RSVP reminders: ' + err.message);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  }

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);

      getRsvpLists()
        .then((res) => {
          if (res.ok && res.body) {
            setRsvpLists(res.body);
          } else {
            setError('Failed to load RSVP lists. Please try again.');
          }
        })
        .catch(() => setError('A network error occurred.'))
        .finally(() => setIsLoading(false));
    } else {
      setSelectedRsvpSlug('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="border-2 border-black bg-white shadow-xl max-w-lg w-full p-6 relative">
        <h2 className="text-lg font-bold mb-4">process rsvp reminders</h2>

        {isLoading ? (
          <p className="text-xs mb-4">Loading RSVP lists...</p>
        ) : error ? (
          <p className="text-red-500 text-xs mb-4">{error}</p>
        ) : (
          <>
            {/* Dropdown RSVP lists */}
            <div className="mb-6">
              <label className="block text-xs font-bold mb-2">
                Select RSVP List
              </label>
              <select
                value={selectedRsvpSlug}
                onChange={(e) => setSelectedRsvpSlug(e.target.value)}
                className="w-full border-2 border-black p-2 text-sm bg-white cursor-pointer focus:outline-none"
              >
                <option value="">-- Choose a list --</option>
                {rsvpLists.map((list) => (
                  <option key={list.slug} value={list.slug}>
                    {list.title}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-red-500 italic">
                Unredeemed tickets from this list AND unredeemed hub invites
                will be processed.
              </p>
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
            disabled={isProcessing}
          >
            cancel
          </button>
          <button
            onClick={() => handleProcessRsvpReminders(selectedRsvpSlug)}
            className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase text-white bg-black hover:bg-gray-800"
            disabled={isProcessing || !selectedRsvpSlug || !!error}
          >
            {isProcessing ? 'Processing...' : 'process all'}
          </button>
        </div>
      </div>
    </div>
  );
}
