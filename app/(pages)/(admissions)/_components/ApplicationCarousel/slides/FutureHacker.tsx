'use client';

import React, { useEffect } from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { fetchUniversityNames } from '@utils/fetch/fetchUniversityNames';
import { fetchCountryNames } from '@utils/fetch/fetchCountryNames';

interface FutureHackerProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function FutureHacker({
  formData,
  setFormData,
  onNext,
}: FutureHackerProps) {
  const [universities, setUniversities] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [countries, setCountries] = React.useState<string[]>([]);

  const isValid =
    formData.age &&
    formData.age >= 17 &&
    typeof formData.isOver18 === 'boolean' &&
    typeof formData.isUCDavisStudent === 'boolean' &&
    formData.countryOfResidence &&
    formData.university &&
    (formData.university !== 'Other' ||
      (formData.customUniversity || '').trim() !== '');

  useEffect(() => {
    fetchUniversityNames().then((data) => setUniversities(data));
  }, []);

  useEffect(() => {
    fetchCountryNames().then((data) => setCountries(data));
  }, []);

  const uniqueUniversities = Array.from(new Set(universities));
  const uniqueCountries = Array.from(new Set(countries));

  useEffect(() => {
    if (formData.isUCDavisStudent === true) {
      setFormData((prev: any) => ({
        ...prev,
        university: 'University of California Davis',
      }));
    }
  }, [formData.isUCDavisStudent, setFormData]);

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return;
    onNext?.();
  };

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center pb-5">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Future Hacker <br /> Incoming
        </h1>

        <div className="mt-12 text-left space-y-10">
          {/* AGE — FIRST QUESTION */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              How old are you?*
            </p>

            <div className="mt-3">
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                value={formData.age || ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
                  const age = digits === '' ? undefined : Number(digits);
                  setFormData({ ...formData, age });
                }}
                className="w-20 rounded-full bg-[#E5EEF1] px-4 py-2 text-center text-sm font-semibold text-[#005271] outline-none"
              />
            </div>

            {submitted && !formData.age && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please enter your age.
              </p>
            )}

            {formData.age && formData.age < 17 && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: You must be at least 17 years old.
              </p>
            )}
          </div>

          {/* OVER 18 */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Will you be at least 18 years old by DOE?*
            </p>

            <YesNoGroup
              value={formData.isOver18}
              onChange={(v) => setFormData({ ...formData, isOver18: v })}
            />
            {submitted && typeof formData.isOver18 !== 'boolean' && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select an option.
              </p>
            )}
          </div>

          {/* UC DAVIS */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Are you a UC Davis student?*
            </p>

            <YesNoGroup
              value={formData.isUCDavisStudent}
              onChange={(v) =>
                setFormData({ ...formData, isUCDavisStudent: v })
              }
            />
            {submitted && typeof formData.isUCDavisStudent !== 'boolean' && (
              <p className="mt-3 text-sm font-semibold text-red-400">
                ERROR: Please select an option.
              </p>
            )}
          </div>

          {/* COUNTRY */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              What is your country of residence?*
            </p>

            <div className="mt-4">
              <div className="relative">
                <select
                  value={formData.countryOfResidence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      countryOfResidence: e.target.value,
                    })
                  }
                  className="w-full appearance-none rounded-full bg-[#E5EEF1] px-6 py-4 text-sm outline-none"
                >
                  <option value="" />
                  {uniqueCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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

              {submitted && !formData.countryOfResidence && (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Wait! You left this one blank.
                </p>
              )}
            </div>
          </div>

          {/* UNIVERSITY */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Which University do you attend?*
            </p>

            <div className="mt-4">
              <div className="relative">
                <select
                  disabled={formData.isUCDavisStudent === true}
                  value={formData.university}
                  onChange={(e) =>
                    setFormData({ ...formData, university: e.target.value })
                  }
                  className="w-full appearance-none rounded-full bg-[#E5EEF1] px-6 py-4 text-sm outline-none"
                >
                  <option value="" />
                  {uniqueUniversities.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                  <option value="Other">Other</option>
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

              {submitted && !formData.university && (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Wait! You left this one blank.
                </p>
              )}

              <div className="h-32">
                {formData.university === 'Other' && (
                  <textarea
                    value={formData.customUniversity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customUniversity: e.target.value,
                      })
                    }
                    placeholder="Please specify your school"
                    className="mt-4 h-24 w-full resize-none rounded-2xl bg-[#E5EEF1] px-6 py-4 text-sm outline-none"
                  />
                )}
              </div>

              {submitted &&
                formData.university === 'Other' &&
                !(formData.customUniversity || '').trim() && (
                  <p className="mt-3 text-sm font-semibold text-red-400">
                    ERROR: Please specify your school.
                  </p>
                )}
            </div>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            disabled={!isValid}
            onClick={handleNext}
            className={`flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 ${
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
