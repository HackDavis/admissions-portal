'use client';

import React from 'react';

const GENDER_OPTIONS = [
  'Woman',
  'Man',
  'Transgender',
  'Non-Binary or Non-Conforming',
  'Prefer not to answer',
  'Other',
];
const RACE_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian or Pacific Islander',
  'Black or African American',
  'Hispanic or Latinx or Chicanx',
  'White or Caucasian',
  'Prefer not to answer',
  'Other',
];

interface DiversityProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function Diversity({
  formData,
  setFormData,
  onNext,
}: DiversityProps) {
  const toggleOption = (section: 'gender' | 'race', value: string) => {
    const currentArray = formData[section] || [];
    const exists = currentArray.includes(value);
    setFormData({
      ...formData,
      [section]: exists
        ? currentArray.filter((v: string) => v !== value)
        : [...currentArray, value],
    });
  };

  const isValid =
    formData.attendedHackDavis !== null && formData.firstHackathon !== null;

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Diversity matters
          <br />
          to us!
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Feel free to skip any question. Responses are only
          <br />
          collected to improve inclusivity at HackDavis.
        </p>

        <div className="mt-12 text-left space-y-12">
          <Question
            title="What’s your gender?"
            section="gender"
            formData={formData}
            onToggle={toggleOption}
          />

          <Question
            title="Which race/ethnicity do you identify with?"
            section="race"
            formData={formData}
            onToggle={toggleOption}
          />

          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Have you attended HackDavis before?*
            </p>

            <YesNoGroup
              value={formData.attendedHackDavis}
              onChange={(v) =>
                setFormData({ ...formData, attendedHackDavis: v })
              }
            />
          </div>

          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Is this your first hackathon?*
            </p>

            <YesNoGroup
              value={formData.firstHackathon}
              onChange={(v) => setFormData({ ...formData, firstHackathon: v })}
            />
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            disabled={!isValid}
            onClick={onNext}
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

function Question({
  title,
  section,
  formData,
  onToggle,
}: {
  title: string;
  section: 'gender' | 'race';
  formData: any;
  onToggle: (section: 'gender' | 'race', value: string) => void;
}) {
  const options = section === 'gender' ? GENDER_OPTIONS : RACE_OPTIONS;
  const currentArray = formData[section] || [];

  return (
    <div>
      <p className="mb-5 text-base font-semibold text-[#0F2530]">{title}</p>

      <div className="space-y-4">
        {options.map((option) => (
          <OptionRow
            key={option}
            label={option}
            checked={currentArray.includes(option)}
            onChange={() => onToggle(section, option)}
          />
        ))}
      </div>
    </div>
  );
}

function OptionRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-4 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-[#A6BFC7] accent-[#173B47]"
      />
      <span className="text-sm text-[#0F2530]">{label}</span>
    </label>
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
