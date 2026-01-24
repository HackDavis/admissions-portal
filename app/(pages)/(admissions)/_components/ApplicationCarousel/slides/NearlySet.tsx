'use client';

import React from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { MultiSelectGroup } from '../_components/MultiSelectGroup';

const YEAR_OPTIONS = ['1', '2', '3', '4', '5+'] as const;

const SHIRT_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Kosher',
  'Allergies',
  'Halal',
  'None',
  'Other',
];

interface NearlySetProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function NearlySet({
  formData,
  setFormData,
  onNext,
}: NearlySetProps) {
  const [submitted, setSubmitted] = React.useState(false);

  const isValid =
    !!formData.year &&
    !!formData.shirtSize &&
    Array.isArray(formData.dietaryRestrictions) &&
    formData.dietaryRestrictions.length > 0 &&
    typeof formData.connectWithSponsors === 'boolean';

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return;
    onNext?.();
  };

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center pb-20">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          We&apos;re Nearly Set!
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Responses are only collected to improve HackDavis.
        </p>

        <div className="mt-12 text-left space-y-10">
          {/* Year in school */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Year in school?*
            </p>

            <div className="mt-4 grid grid-cols-3 gap-y-4">
              {YEAR_OPTIONS.map((opt) => {
                const val = String(opt);
                const checked = String(formData.year) === val;

                return (
                  <label
                    key={val}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="year"
                      checked={checked}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          year: val,
                        })
                      }
                      className="h-4 w-4 accent-[#005271]"
                    />
                    <span className="text-sm text-[#0F2530]">{val}</span>
                  </label>
                );
              })}
            </div>

            {submitted && !formData.year && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select your year in school.
              </p>
            )}
          </div>

          {/* Shirt size */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Shirt size?*
            </p>

            <Select
              placeholder="Select an option"
              value={formData.shirtSize || ''}
              options={SHIRT_OPTIONS}
              onChange={(v) => setFormData({ ...formData, shirtSize: v })}
            />

            {submitted && !formData.shirtSize && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select a shirt size.
              </p>
            )}
          </div>

          {/* Dietary restrictions */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Do you have any dietary restrictions?*
            </p>

            <MultiSelectGroup
              options={DIETARY_OPTIONS}
              value={formData.dietaryRestrictions || []}
              onChange={(next) => {
                // enforce "None" behavior
                if (next.includes('None') && next.length > 1) {
                  setFormData({ ...formData, dietaryRestrictions: ['None'] });
                  return;
                }
                setFormData({ ...formData, dietaryRestrictions: next });
              }}
            />

            {submitted &&
              (!Array.isArray(formData.dietaryRestrictions) ||
                formData.dietaryRestrictions.length === 0) && (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Please select at least one option.
                </p>
              )}
          </div>

          {/* Sponsors connect */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Would you like to be connected to internship and full-time career
              opportunities from our sponsors and partners?*
            </p>

            <YesNoGroup
              value={formData.connectWithSponsors}
              onChange={(v) =>
                setFormData({ ...formData, connectWithSponsors: v })
              }
            />

            {submitted && typeof formData.connectWithSponsors !== 'boolean' && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select an option.
              </p>
            )}
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
