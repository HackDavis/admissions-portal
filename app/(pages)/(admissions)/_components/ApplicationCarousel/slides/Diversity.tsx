'use client';

import React from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { useEnterKey } from '../../../_hooks/useEnterKey';

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
  isActive: boolean;
}

export default function Diversity({
  formData,
  setFormData,
  onNext,
  isActive,
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
    typeof formData.attendedHackDavis === 'boolean' &&
    typeof formData.firstHackathon === 'boolean';

  const handleNext = () => {
    if (!isValid) return;
    onNext?.();
  };

  useEnterKey(handleNext, isActive);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center pb-24">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Diversity matters
          <br />
          to us!
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Responses are only collected to improve inclusivity at HackDavis.
        </p>

        <div className="mt-12 text-left space-y-10">
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

        <div className="mt-10 flex justify-center">
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
