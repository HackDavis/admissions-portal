'use client';

import React, { useEffect, useState } from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { fetchMajors } from '@utils/fetch/fetchMajors';
import { fetchMinors } from '@utils/fetch/fetchMinors';
import { MultiSelectGroup } from '../_components/MultiSelectGroup';
import { useEnterKey } from '../../../_hooks/useEnterKey';

const COLLEGE_OPTIONS = [
  'College of Engineering',
  'College of Letters and Science',
  'College of Biological Sciences',
  'College of Agricultural and Environmental Sciences',
  'Other',
];

const LEVEL_OF_STUDY_OPTIONS = [
  'Less than Secondary / High School',
  'Secondary / High School',
  'Undergraduate University (2 year - community college or similar)',
  'Undergraduate University (3+ year)',
  'Graduate University (Masters, Professional, Doctoral, etc)',
  'Code School / Bootcamp',
  'Other Vocational / Trade Program or Apprenticeship',
  'Post Doctorate',
  'Other',
  'I’m not currently a student',
  'Prefer not to answer',
];

interface KeepGoingProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
  isActive: boolean;
}

export default function KeepGoing({
  formData,
  setFormData,
  onNext,
  isActive,
}: KeepGoingProps) {
  const [majorOptions, setMajorOptions] = useState<string[]>([]);
  const [minorOptions, setMinorOptions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const [hasMinorOrDoubleMajor, setHasMinorOrDoubleMajor] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    fetchMajors().then(setMajorOptions);
    fetchMinors().then(setMinorOptions);
  }, []);

  const isUCDSelected =
    formData.isUCDavisStudent === true ||
    formData.university === 'University of California Davis';

  useEffect(() => {
    if (hasMinorOrDoubleMajor === false && formData.minorOrDoubleMajor) {
      setFormData({ ...formData, minorOrDoubleMajor: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMinorOrDoubleMajor]);

  const hasSelection = (value: unknown) =>
    Array.isArray(value) ? value.length > 0 : !!value;

  const isValid =
    hasSelection(formData.levelOfStudy) &&
    hasSelection(formData.major) &&
    hasMinorOrDoubleMajor !== null &&
    (hasMinorOrDoubleMajor === false ||
      hasSelection(formData.minorOrDoubleMajor)) &&
    (!isUCDSelected ||
      (Array.isArray(formData.college) && formData.college.length > 0));

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return;
    onNext?.();
  };

  useEnterKey(handleNext, isActive);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center pb-14">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Keep Going...
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Responses are only collected to improve HackDavis.
        </p>

        <div className="mt-12 text-left space-y-10">
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              What is your current level of study?*
            </p>

            <Select
              placeholder="Select an option"
              value={formData.levelOfStudy || ''}
              options={LEVEL_OF_STUDY_OPTIONS}
              onChange={(v) => setFormData({ ...formData, levelOfStudy: v })}
            />

            {submitted && !formData.levelOfStudy && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Wait! You left this one blank.
              </p>
            )}
          </div>

          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              What’s your major?*
            </p>
            <p className="mt-1 text-sm leading-snug text-[#005271]">
              If you have more than one major, please select your primary major.
            </p>

            <Select
              placeholder={
                majorOptions.length ? 'Select an option' : 'Loading majors...'
              }
              value={formData.major || ''}
              options={majorOptions}
              onChange={(v) => setFormData({ ...formData, major: v })}
            />

            {submitted && !formData.major && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Wait! You left this one blank.
              </p>
            )}
          </div>

          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Do you have a minor or a double major?*
            </p>

            <YesNoGroup
              value={hasMinorOrDoubleMajor}
              onChange={(v) => setHasMinorOrDoubleMajor(v)}
            />

            {submitted && hasMinorOrDoubleMajor === null && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select Yes or No.
              </p>
            )}
          </div>

          <div className={hasMinorOrDoubleMajor !== true ? 'opacity-50' : ''}>
            <p className="text-base font-semibold text-[#0F2530]">
              What&apos;s your minor or double major?
            </p>
            <p className="mt-1 text-sm leading-snug text-[#005271]">
              If you have more than one, please select only one of them, or
              select &quot;Other&quot; if it does not appear.
            </p>

            <Select
              placeholder={
                minorOptions.length ? 'Select an option' : 'Loading minors...'
              }
              value={formData.minorOrDoubleMajor || ''}
              options={minorOptions}
              onChange={(v) =>
                setFormData({ ...formData, minorOrDoubleMajor: v })
              }
              disabled={hasMinorOrDoubleMajor !== true}
            />

            {submitted &&
              hasMinorOrDoubleMajor === true &&
              !formData.minorOrDoubleMajor && (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Wait! You left this one blank.
                </p>
              )}
          </div>

          <div className={isUCDSelected ? '' : 'opacity-50'}>
            <p className="text-base font-semibold text-[#0F2530]">
              If you go to UC Davis, what College are you a part of?
            </p>
            <p className="mt-1 text-sm leading-snug text-[#005271]">
              If you have multiple majors or minors, please indicate all
              colleges that you study under.
            </p>

            <div className="mt-4 space-y-3 text-left">
              <MultiSelectGroup
                options={COLLEGE_OPTIONS}
                value={formData.college || []}
                disabled={!isUCDSelected}
                onChange={(next) => {
                  if (!isUCDSelected) return;
                  setFormData({ ...formData, college: next });
                }}
              />
            </div>

            {submitted &&
              isUCDSelected &&
              (!Array.isArray(formData.college) ||
                formData.college.length === 0) && (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Please select a college.
                </p>
              )}
          </div>
        </div>

        {/* Next button (center like screenshot) */}
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

function Select({
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4 relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-full bg-[#E5EEF1] px-6 py-4 text-sm outline-none ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[#005271]">
        ▾
      </span>
    </div>
  );
}
