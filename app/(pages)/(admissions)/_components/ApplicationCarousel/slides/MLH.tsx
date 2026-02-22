'use client';

import React from 'react';
import { ConfirmSubmitModal } from '../_components/ConfirmSubmitModal';
import { MultiSelectGroup } from '../_components/MultiSelectGroup';

const AGREEMENT_OPTIONS = [
  'MLH Code of Conduct',
  'Event Logistics Information',
] as const;

export default function MLH({ formData, setFormData, onNext, isActive }: any) {
  const [submitted, setSubmitted] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  // allows reuse of MultiSelectGroup component, but maps to boolean fields in formData
  const agreements: string[] = Object.entries(formData.mlhAgreements)
    .filter(([_, v]) => v)
    .map(([k]) =>
      k === 'mlhCodeOfConduct'
        ? 'MLH Code of Conduct'
        : 'Event Logistics Information'
    );

  const isValid =
    Array.isArray(agreements) &&
    AGREEMENT_OPTIONS.every((opt) => agreements.includes(opt));

  const handleSubmitClick = () => {
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

  const handleConfirmSubmit = async () => {
    try {
      const result = await onNext?.(); // submit application
      if (result === false) {
        throw new Error('Submission failed');
      }
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
      throw new Error('Submission failed');
    }
  };

  return (
    <section className="w-full relative">
      <div className="mx-auto w-full max-w-[520px] text-center pb-24">
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
              MLH Code of Conduct: " I have read and agree to the{' '}
              <a
                href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#007a99]"
              >
                MLH Code of Conduct
              </a>
              ."
            </p>

            <p className="text-xs leading-snug text-[#005271]">
              Event Logistics Information: " I authorize you to share my
              application/registration information with Major League Hacking for
              event administration, ranking, and MLH administration in-line with
              the{' '}
              <a
                href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#007a99]"
              >
                MLH Privacy Policy
              </a>
              . I further agree to the terms of both the{' '}
              <a
                href="https://github.com/MLH/mlh-policies/blob/main/contest-terms.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#007a99]"
              >
                MLH Contest Terms and Conditions
              </a>{' '}
              and the{' '}
              <a
                href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#007a99]"
              >
                MLH Privacy Policy
              </a>
              ."
            </p>
          </div>

          <MultiSelectGroup
            options={['MLH Code of Conduct', 'Event Logistics Information']}
            value={Object.entries(formData.mlhAgreements)
              .filter(([_, v]) => v)
              .map(([k]) =>
                k === 'mlhCodeOfConduct'
                  ? 'MLH Code of Conduct'
                  : 'Event Logistics Information'
              )}
            onChange={(selected) =>
              setFormData({
                ...formData,
                mlhAgreements: {
                  mlhCodeOfConduct: selected.includes('MLH Code of Conduct'),
                  eventLogisticsInformation: selected.includes(
                    'Event Logistics Information'
                  ),
                },
              })
            }
          />

          <p className={`mt-3 text-sm font-semibold text-red-400 ${submitted && !isValid ? '' : 'invisible'}`}>
            ERROR: Please check both boxes.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
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
        onConfirm={handleConfirmSubmit}
      />
    </section>
  );
}
