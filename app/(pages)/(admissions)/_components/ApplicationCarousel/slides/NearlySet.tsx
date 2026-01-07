'use client';

import React from 'react';

type YesNo = 'yes' | 'no' | null;

type FormState = {
  is18: YesNo;
  isUCD: YesNo;
  university: string;
  notes: string;
};

interface NearlySetProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function NearlySet({ formData, setFormData, onNext }: NearlySetProps) {

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          We’re Nearly Set!
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications. <br />
          Feel free to skip any question. Responses are only <br />
          collected to improve inclusivity at HackDavis.
        </p>

        <div className="mt-12 text-left space-y-10">
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Will you be at least 18 years old by DOE?
            </p>

            <YesNoGroup
              value={formData.isOver18 ? 'yes' : formData.isOver18 === false ? 'no' : null}
              onChange={(v) => setFormData({ ...formData, isOver18: v === 'yes' })}
            />
          </div>

          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Are you a UC Davis student?
            </p>

            <YesNoGroup
              value={formData.isUCDavisStudent ? 'yes' : formData.isUCDavisStudent === false ? 'no' : null}
              onChange={(v) => setFormData({ ...formData, isUCDavisStudent: v === 'yes' })}
            />
          </div>

          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Which University do you attend?
            </p>

            <div className="mt-4">
              <div className="relative">
                <select
                  value={formData.university}
                  onChange={(e) =>
                    setFormData({ ...formData, university: e.target.value })
                  }
                  className="w-full appearance-none rounded-full bg-[#E5EEF1] px-6 py-4 text-sm outline-none"
                >
                  <option value="" />
                  <option>UC Davis</option>
                  <option>UC Berkeley</option>
                  <option>Stanford</option>
                  <option>Other</option>
                </select>

                <svg
                  className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005271]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              <div className="h-32">
                {formData.university === 'Other' && (
                  <textarea
                    value={formData.customUniversity}
                    onChange={(e) =>
                      setFormData({ ...formData, customUniversity: e.target.value })
                    }
                    placeholder="Please specify your school"
                    className="mt-4 h-24 w-full resize-none rounded-2xl bg-[#E5EEF1] px-6 py-4 text-sm outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95"
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function YesNoGroup({
  value,
  onChange,
}: {
  value: 'yes' | 'no' | null;
  onChange: (v: 'yes' | 'no') => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <YesNoOption
        label="Yes"
        active={value === 'yes'}
        onClick={() => onChange('yes')}
      />
      <YesNoOption
        label="No"
        active={value === 'no'}
        onClick={() => onChange('no')}
      />
    </div>
  );
}

function YesNoOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-fit items-center gap-3 rounded-full transition',
        active
          ? 'bg-[#173B47] px-4 py-2 text-white shadow-[4px_4px_0_rgba(159,182,190,0.8)]'
          : 'px-1 py-1 text-[#005271] ml-3',
      ].join(' ')}
    >
      <span
        className={[
          'h-4 w-4 rounded-full border-2',
          active ? 'border-white bg-[#9FB6BE]' : 'border-[#9FB6BE]',
        ].join(' ')}
      />
      <span className="text-sm font-medium leading-none">{label}</span>
    </button>
  );
}
