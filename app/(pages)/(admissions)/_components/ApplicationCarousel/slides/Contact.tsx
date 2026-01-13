'use client';

import React from 'react';

type FieldId = 'firstName' | 'lastName' | 'phone' | 'age';

type Question = {
  id: FieldId;
  label: string;
  required?: boolean;
};

const QUESTIONS: Question[] = [
  { id: 'firstName', label: 'First Name', required: true },
  { id: 'lastName', label: 'Last Name', required: true },
  { id: 'phone', label: 'Phone number', required: true },
  { id: 'age', label: 'Age', required: true },
];

const PHONE_REGEX = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/;
const isValidPhone = (value: string) => {
  return PHONE_REGEX.test(value.trim());
};

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

  const onChange =
    (id: FieldId) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [id]: e.target.value });
    };

  const handleNext = () => {
    setSubmitted(true);

    const missingRequired = QUESTIONS.some(
      (q) => q.required && (formData[q.id] || '').trim() === ''
    );
    if (missingRequired) return;

    if (!isValidPhone(formData.phone || '')) return;

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
          const value = (formData[q.id] || '').trim();
          const isEmptyError = submitted && q.required && value === '';
          const isPhoneError =
            submitted &&
            q.id === 'phone' &&
            value !== '' &&
            !isValidPhone(value);

          return (
            <div key={q.id}>
              <label className="block text-sm font-semibold text-[#0F2530]">
                {q.label}
                {q.required ? '*' : ''}
              </label>

              <input
                value={formData[q.id] || ''}
                onChange={onChange(q.id)}
                className={[
                  'mt-3 w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-base text-[#0F2530] outline-none',
                  isEmptyError || isPhoneError ? 'ring-1 ring-red-400' : '',
                ].join(' ')}
              />

              {isEmptyError ? (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Wait! You left this one blank.
                </p>
              ) : isPhoneError ? (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Please enter a valid phone number (10-digit or (###)
                  ###-#### ).
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleNext}
            className="mx-auto flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 active:opacity-90"
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
