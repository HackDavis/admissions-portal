'use client';

import React from 'react';

interface MLHProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function MLH({ formData, setFormData, onNext }: MLHProps) {
  const [submitted, setSubmitted] = React.useState(false);

  // REQUIRED: both checkboxes must be checked
  const isValid = !!formData.mlhCodeOfConduct && !!formData.mlhEventLogistics;

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return;
    onNext?.();
  };

  return (
    <section className="w-full">
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

          {/* Copy blocks */}
          <div className="space-y-4">
            <p className="text-xs leading-snug text-[#005271] underline underline-offset-2">
              MLH Code of Conduct: &quot;I have read and agree to the MLH Code of
              Conduct.&quot;
            </p>

            <p className="text-xs leading-snug text-[#005271] underline underline-offset-2">
              Event Logistics Information: &quot;I authorize you to share my
              application/registration information with Major League Hacking for
              event administration, ranking, and MLH administration in-line with
              the MLH Privacy Policy. I further agree to the terms of both the
              MLH Contest Terms and Conditions and the MLH Privacy Policy.&quot;
            </p>
          </div>

          {/* Checkbox pills */}
          <div className="space-y-3 pt-2">
            <PillCheckbox
              label="MLH Code of Conduct"
              checked={!!formData.mlhCodeOfConduct}
              onToggle={() =>
                setFormData({
                  ...formData,
                  mlhCodeOfConduct: !formData.mlhCodeOfConduct,
                })
              }
            />

            <PillCheckbox
              label="Event Logistics Information"
              checked={!!formData.mlhEventLogistics}
              onToggle={() =>
                setFormData({
                  ...formData,
                  mlhEventLogistics: !formData.mlhEventLogistics,
                })
              }
            />
          </div>

          {submitted && !isValid && (
            <p className="text-sm font-semibold text-red-400">
              ERROR: Please agree to both items to continue.
            </p>
          )}
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

function PillCheckbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-4 text-left"
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full border ${
          checked ? 'border-[#005271] bg-[#005271]' : 'border-[#A6BFC7] bg-white'
        }`}
        aria-hidden
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
      </span>

      <span className="text-sm text-[#0F2530]">{label}</span>
    </button>
  );
}
