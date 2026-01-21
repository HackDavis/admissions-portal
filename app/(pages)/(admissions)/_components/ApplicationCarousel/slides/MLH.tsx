'use client';

import React from 'react';
import Image from 'next/image';
import { ConfirmSubmitModal } from '../_components/ConfirmSubmitModal';
import { MultiSelectGroup } from '../_components/MultiSelectGroup';

const AGREEMENT_OPTIONS = [
  'MLH Code of Conduct',
  'Event Logistics Information',
] as const;

export default function MLH({ formData, setFormData, onNext }: any) {
  const [submitted, setSubmitted] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const agreements: string[] = formData.mlhAgreements ?? [];

  const isValid =
    Array.isArray(agreements) &&
    AGREEMENT_OPTIONS.every((opt) => agreements.includes(opt));

  const handleSubmitClick = () => {
    // submit is only clickable when valid,
    // but we’ll still setSubmitted for error UI consistency
    setSubmitted(true);
    setShowConfirm(true);
  };

  // close on ESC (for the inline modal)
  React.useEffect(() => {
    if (!showConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showConfirm]);

  return (
    <section className="w-full relative">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-metropolis text-[40px] font-bold leading-[1.05] tracking-[0.01em] text-[#005271]">
          You&apos;re almost
          <br />
          there, last page!
        </h1>

        <div className="mt-10 text-left space-y-6">
          <p className="text-base font-semibold text-[#0F2530]">
            Please check the boxes that you agree to the following*
          </p>

          <div className="space-y-4">
            <p className="text-xs leading-snug text-[#005271]">
              MLH Code of Conduct: &quot;I have read and agree to the MLH Code of
              Conduct.&quot;
            </p>

            <p className="text-xs leading-snug text-[#005271]">
              Event Logistics Information: &quot;I authorize you to share my
              application/registration information with Major League Hacking for
              event administration, ranking, and MLH administration in-line with
              the MLH Privacy Policy. I further agree to the terms of both the
              MLH Contest Terms and Conditions and the MLH Privacy Policy.&quot;
            </p>
          </div>

          <MultiSelectGroup
            options={[...AGREEMENT_OPTIONS]}
            value={agreements}
            onChange={(next) =>
              setFormData((prev: any) => ({
                ...prev,
                mlhAgreements: next,
              }))
            }
          />

          {submitted && !isValid && (
            <p className="mt-3 text-sm font-semibold text-red-400">
              ERROR: Please check both boxes.
            </p>
          )}
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            disabled={!isValid}
            onClick={handleSubmitClick}
            className={`flex items-center gap-3 rounded-full px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 ${
              isValid ? 'bg-[#005271]' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            SUBMIT! <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <ConfirmSubmitModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onNext?.();
        }}
      />

    </section>
  );
}
