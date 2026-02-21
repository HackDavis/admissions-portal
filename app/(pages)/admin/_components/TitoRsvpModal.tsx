'use client';

import { useState, useEffect } from 'react';
import { RsvpList } from '@app/_types/tito';
import getRsvpLists from '@utils/tito/getRsvpLists';

interface TitoRsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (slug: string) => Promise<void>;
  isProcessing: boolean;
}

export function TitoRsvpModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: TitoRsvpModalProps) {
  const [rsvpLists, setRsvpLists] = useState<RsvpList[]>([]);
  const [selectedRsvpSlug, setSelectedRsvpSlug] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      getRsvpLists().then((res) => {
        if (res.ok && res.body) setRsvpLists(res.body);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="border-2 border-black bg-white shadow-xl max-w-lg w-full p-6 relative">
        <h2 className="text-lg font-bold mb-4">process rsvp reminders</h2>

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
          <p className="mt-2 text-[11px] text-gray-500 italic">
            Only unredeemed tickets from this list AND unredeemed hub invites
            will be processed.
          </p>
        </div>

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
            onClick={() => onConfirm(selectedRsvpSlug)}
            className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase text-white bg-black hover:bg-gray-800"
            disabled={isProcessing || !selectedRsvpSlug}
          >
            {isProcessing ? 'Processing...' : 'process all'}
          </button>
        </div>
      </div>
    </div>
  );
}
