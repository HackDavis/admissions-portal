'use client';

import React from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { useEnterKey } from '../../../_hooks/useEnterKey';

interface FinalStretchProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
  isActive: boolean;
}

export default function FinalStretch({
  formData,
  setFormData,
  onNext,
  isActive,
}: FinalStretchProps) {
  const [submitted, setSubmitted] = React.useState(false);

  const isValid =
    typeof formData.connectWithHackDavis === 'boolean' &&
    typeof formData.connectWithMLH === 'boolean';

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return;
    onNext?.();
  };

  useEnterKey(handleNext, isActive);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center pb-4">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Final stretch!
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Responses are only collected to improve HackDavis.
        </p>

        <div className="mt-12 text-left space-y-12">
          {/* HackDavis updates */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Would you like to receive news and updates from HackDavis in your
              inbox?*
            </p>

            <p className="mt-2 text-xs text-[#005271]">
              We promise we won&apos;t spam :)
            </p>

            <div className="mt-4">
              <YesNoGroup
                value={formData.connectWithHackDavis}
                onChange={(v) =>
                  setFormData({ ...formData, connectWithHackDavis: v })
                }
              />
            </div>

            {submitted && !isValid && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select Yes or No.
              </p>
            )}
          </div>

          {/* MLH optional */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Communication from MLH*
            </p>

            <p className="mt-2 text-xs leading-snug text-[#005271]">
              I authorize MLH to send me occasional emails about relevant
              events, career opportunities, and community announcements.
            </p>

            <div className="mt-4">
              <YesNoGroup
                value={formData.connectWithMLH}
                onChange={(v) =>
                  setFormData({ ...formData, connectWithMLH: v })
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            disabled={!isValid}
            onClick={handleNext}
            className={`flex items-center gap-3 rounded-full px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 ${
              isValid ? 'bg-[#005271]' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
