'use client';

import React, { useEffect, useState } from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { fetchMajors } from '@utils/fetch/fetchMajors';
import { fetchMinors } from '@utils/fetch/fetchMinors';

const COLLEGE_OPTIONS = [
  'College of Engineering',
  'College of Letters and Science',
  'College of Biological Science',
  'College of Agricultural and Environmental Sciences',
  'Other',
];

const LEVEL_OF_STUDY_OPTIONS = [
  'High school',
  'Community college',
  'Undergraduate',
  'Graduate',
  'PhD',
  'Other',
];

interface KeepGoingProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function KeepGoing({
  formData,
  setFormData,
  onNext,
}: KeepGoingProps) {
  const [majorOptions, setMajorOptions] = useState<string[]>([]);
  const [minorOptions, setMinorOptions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchMajors().then(setMajorOptions);
    fetchMinors().then(setMinorOptions);
  }, []);

  const hasMinorOrDoubleMajor = formData.hasMinorOrDoubleMajor; // boolean | null

  // show college only if UC Davis selected
  const isUCDSelected =
    formData.isUCDavisStudent === true ||
    formData.university === 'University of California, Davis';

  // if UC Davis not selected, clear college so validation isn't stuck
  useEffect(() => {
    if (!isUCDSelected && formData.college) {
      setFormData({ ...formData, college: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUCDSelected]);

  const isValid =
    !!formData.levelOfStudy &&
    !!formData.major &&
    hasMinorOrDoubleMajor !== null &&
    (hasMinorOrDoubleMajor === false || !!formData.minorOrDoubleMajor) &&
    (!isUCDSelected || !!formData.college);

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return;
    onNext?.();
  };

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Keep Going..
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Responses are only collected to improve HackDavis.
        </p>

        <div className="mt-12 text-left space-y-10">
          {/* Level of study */}
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

          {/* Major */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              What’s your major?
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

          {/* Minor/double major */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Do you have a minor or a double major?*
            </p>

            <YesNoGroup
              value={hasMinorOrDoubleMajor}
              onChange={(v) =>
                setFormData({
                  ...formData,
                  hasMinorOrDoubleMajor: v,
                  minorOrDoubleMajor: v ? formData.minorOrDoubleMajor : '',
                })
              }
            />

            {submitted && hasMinorOrDoubleMajor === null && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select Yes or No.
              </p>
            )}
          </div>

          {/* Minor select */}
          {hasMinorOrDoubleMajor === true && (
            <div>
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
              />

              {submitted && !formData.minorOrDoubleMajor && (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Wait! You left this one blank.
                </p>
              )}
            </div>
          )}

          {/* College (ONLY if UC Davis) */}
          {isUCDSelected && (
            <div>
              <p className="text-base font-semibold text-[#0F2530]">
                What College are you a part of?*
              </p>
              <p className="mt-1 text-sm leading-snug text-[#005271]">
                If you have multiple majors or minors, please indicate all
                colleges that you study under.
              </p>

              <div className="mt-4 space-y-3">
                {COLLEGE_OPTIONS.map((opt) => (
                  <PillRadio
                    key={opt}
                    label={opt}
                    checked={formData.college === opt}
                    onSelect={() => setFormData({ ...formData, college: opt })}
                  />
                ))}
              </div>

              {submitted && !formData.college && (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Please select a college.
                </p>
              )}
            </div>
          )}
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
}: {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4 relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-full bg-[#E5EEF1] px-6 py-4 text-sm outline-none"
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

function PillRadio({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-4 text-left"
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full border ${
          checked
            ? 'border-[#005271] bg-[#005271]'
            : 'border-[#A6BFC7] bg-white'
        }`}
        aria-hidden
      >
        {checked ? (
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
        ) : null}
      </span>

      <span className="text-sm text-[#0F2530]">{label}</span>
    </button>
  );
}
