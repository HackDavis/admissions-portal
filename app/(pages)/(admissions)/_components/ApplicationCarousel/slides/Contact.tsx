'use client';

import React from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

type FieldId = 'firstName' | 'lastName' | 'phone';

type Question = {
  id: FieldId;
  label: string;
  required?: boolean;
};

const QUESTIONS: Question[] = [
  { id: 'firstName', label: 'First Name', required: true },
  { id: 'lastName', label: 'Last Name', required: true },
  { id: 'phone', label: 'Phone number', required: true },
];

interface ContactProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function Contact({
  formData,
  setFormData,
  onNext,
}: ContactProps) {
  const [submitted, setSubmitted] = React.useState(false);
  const isValid = !QUESTIONS.some((q) => q.required && !formData[q.id]);

  const onChange =
    (id: FieldId) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [id]: e.target.value });
    };

  const handleNext = () => {
    setSubmitted(true);
    if (!isValidPhoneNumber(formData.phone || '')) return;
    if (!isValid) return;
    onNext?.();
  };

  return (
    <section className="w-full">
      <header className="text-center">
        <h1 className="text-center text-[48px] text-[#005271] font-bold leading-[1] tracking-[0.01em]">
          Help us get to
          <br />
          know you better!
        </h1>
      </header>

      <div className="mx-auto mt-12 w-full max-w-lg space-y-10">
        {QUESTIONS.map((q) => {
          const value = formData[q.id];
          const isEmptyError = submitted && q.required && !value;

          const isPhoneError =
            submitted &&
            q.id === 'phone' &&
            value &&
            !isValidPhoneNumber(value);

          return (
            <div key={q.id}>
              <label className="block text-sm font-semibold text-[#0F2530]">
                {q.label}
                {q.required ? '*' : ''}
              </label>

              {q.id !== 'phone' && (
                <input
                  value={value || ''}
                  onChange={onChange(q.id)}
                  className={[
                    'mt-3 w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-base text-[#0F2530] outline-none',
                    isEmptyError ? 'ring-1 ring-red-400' : '',
                  ].join(' ')}
                />
              )}

              {q.id === 'phone' && (
                <div
                  className={[
                    'mt-3 flex items-center gap-3 rounded-full bg-[#E5EEF1] px-3 py-2',
                    isEmptyError || isPhoneError ? 'ring-1 ring-red-400' : '',
                  ].join(' ')}
                >
                  <PhoneInput
                    defaultCountry="US"
                    international={false}
                    value={formData.phone}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        phone: value,
                      })
                    }
                    className="flex items-center w-full bg-[#E5EEF1]"
                    countrySelectProps={{
                      className:
                        'flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 relative',
                    }}
                    placeholder="Phone number"
                  />
                </div>
              )}

              {isEmptyError ? (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Wait! You left this one blank.
                </p>
              ) : isPhoneError ? (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Please enter a valid phone number.
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="pt-2">
          <button
            type="button"
            disabled={!isValid}
            onClick={handleNext}
            className={`mx-auto flex items-center gap-3 rounded-full px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 active:opacity-90 ${
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
