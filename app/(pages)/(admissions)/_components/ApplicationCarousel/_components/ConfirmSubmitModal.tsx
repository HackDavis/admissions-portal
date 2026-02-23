'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface ConfirmSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmSubmitModal({
  open,
  onClose,
  onConfirm,
}: ConfirmSubmitModalProps) {
  const [mounted, setMounted] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    try {
      await onConfirm();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-submit-title"
    >
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Modal */}
      <div className="relative w-full max-w-[560px]">
        <div className="rounded-[28px] border border-[#A6BFC7] bg-[#E5EEF1] p-3 shadow-[18px_18px_0_#A6BFC7]">
          {/* this is upper tab */}
          <div className="relative h-10 rounded-[20px] bg-[#E5EEF1]" />

          {/* White panel */}
          <div className="relative mt-3 rounded-[22px] bg-white p-10">
            <h2
              id="confirm-submit-title"
              className="text-[28px] font-bold leading-[1.05] text-[#005271]"
            >
              Are you sure you want to submit?
            </h2>

            <p className="mt-4 text-xs font-semibold leading-snug text-[#0F2530]">
              <span className="font-extrabold">NOTE:</span> Only one email can
              be tied to one application. Multiple submissions from the same
              email will not be accepted.
            </p>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="rounded-full bg-[#005271] px-10 py-3 text-xs font-bold text-white shadow-[0_6px_0_rgba(0,82,113,0.25)] transition hover:opacity-95"
              >
                {loading ? 'Submitting...' : 'YES, SUBMIT'}
              </button>
            </div>
            {error && (
              <p className="pt-3 text-red-600 text-sm font-semibold text-center">
                {error}
              </p>
            )}

            {/* Footer art */}
            <div className="mt-10 overflow-hidden rounded-[18px] bg-[#E5EEF1]">
              <div className="relative h-[120px] w-full">
                <Image
                  src="/Images/SubmissionWindow.svg"
                  alt="Cute animals footer"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
